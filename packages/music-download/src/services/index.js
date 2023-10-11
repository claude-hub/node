/*
 * @@Author: zhangyunpeng@sensorsdata.cn
 * @@Description:
 * @Date: 2023-10-08 17:26:12
 * @LastEditTime: 2023-10-11 14:40:13
 */
const mm = require('music-metadata');
const queryMusic = require('@claude-hub/music-source');
const { user_cloud, login_cellphone, cloud } = require('NeteaseCloudMusicApi');
const fs = require('fs');
const path = require('path');
const { downloadMusic } = require('../utils');

const cookiePath = path.resolve(__dirname, 'cookie.txt');

const loginByPhone = async () => {
  try {
    const result = await login_cellphone({
      phone: '',
      password: '',
    });
    // 如果登录报错了。提示一下
    if (!result.body?.cookie) {
      console.log('登录异常：', result);
    }

    const { cookie = '' } = result.body;
    // 更新 cookie
    if (cookie) {
      fs.writeFileSync(cookiePath, cookie);
    }
    return cookie;
  } catch (e) {
    console.log('登录异常：', e);
    return '';
  }
};

const login = async () => {
  // 如果文件不存在，则直接登录
  if (!fs.existsSync(cookiePath)) {
    return await loginByPhone();
  }

  // 如果文件存在，则使用旧的 cookie
  const oldCookie = fs.readFileSync(cookiePath, {
    encoding: 'utf-8',
  });
  try {
    // 尝试使用本地的 cookie 获取云盘中的歌曲，如果失败，则 cookie 有问题。
    await getCloudMusics(oldCookie, 1);
    return oldCookie;
  } catch (e) {
    return await loginByPhone();
  }
};

const getCloudMusics = async (cookie, limit = 10000) => {
  try {
    const result = await user_cloud({
      limit,
      cookie,
    });

    return result.body.data?.map((item) => item.simpleSong.name) || [];
  } catch (e) {
    console.log('获取云盘歌单失败: ', e);
    return [];
  }
};

const downlaodNeteaseCloudMusic = async (id, filePath) => {
  const url = `https://music.163.com/song/media/outer/url?id=${id}.mp3`;
  const mp3Path = filePath.replace('.flac', '.mp3');
  if (fs.existsSync(mp3Path)) return mp3Path;
  try {
    await downloadMusic(url, mp3Path);
  } catch (e) {
    return '';
  }

  return mp3Path;
};

const downloadHifini = async (name) => {
  return new Promise(async (resolve) => {
    setTimeout(async () => {
      try {
        const url = await queryMusic(name);
        resolve(url);
      } catch {
        resolve('');
      }
    }, 100);
  });
};

const uploadSong = async (cookie, filePath, id) => {
  let newFilePath = filePath;
  try {
    // 判断是否能上传。如果歌曲没有专辑等信息则不能上传
    const canUplaod = await checkUpload(newFilePath);

    if(!canUplaod && !id) {
      console.log('歌曲无专辑等信息，不能上传: ', path.basename(newFilePath));
      return;
    }

    // 不能上传则下载网易云
    // if(!canUplaod && id) {
    //   newFilePath = await downlaodNeteaseCloudMusic(id, newFilePath);
    // }
    // if (!newFilePath) {
    //   console.log('网易云下载不了');

    //   const fileName = path.basename(filePath)
    //   const formatted = fileName.replace(/\s/g, '');
    //   const end = formatted.lastIndexOf('.');
    //   const start = formatted.lastIndexOf('-');
    //   const name = formatted.substring(start + 1, end);

    //   const hifiniMusicUrl = await downloadHifini(name);
    //   newFilePath = filePath.replace('.flac', '.mp3');
    //   await downloadMusic(hifiniMusicUrl, newFilePath)

    //   // 判断是否能上传。如果歌曲没有专辑等信息则不能上传
    //   const canUplaod = await checkUpload(newFilePath);
    //   if(!canUplaod) {
    //     console.log('hifini 下载的不能上传');
    //     return;
    //   }
    // }

    const fileName = path.basename(newFilePath);
    const fileState = fs.statSync(newFilePath);
    // 小于 2 M的歌曲不需要上传
    if (fileState.size / 1024 / 1024 < 2.5) {
      console.log('文件小于 2.5M 终止上传: ', fileName);
      return;
    }

    const res = await cloud({
      songFile: {
        name: fileName,
        data: fs.readFileSync(newFilePath),
      },
      cookie,
    });
    if ([200, 201].includes(res.body.code)) {
      console.log('上传成功: ', res.body.privateCloud.fileName);
    } else {
      console.log('上传异常：', res);
    }
  } catch (e) {
    console.log('上传异常：', e);
    fs.appendFileSync(
      path.resolve(__dirname, '../error.txt'),
      `上传失败: ${path.basename(newFilePath)}\n`,
      'utf-8'
    );
  }
};

const checkUpload = async (filePath) => {
  if (!fs.existsSync(filePath)) return false;

  const data = fs.readFileSync(filePath);
  const metadata = await mm.parseBuffer(data);
  const info = metadata.common;
  const { album, artist } = info;

  if (metadata.format.codec === 'FLAC') {
    // 专辑 & 歌手，直接返回可上传
    if (album && album !== 'kuwo' && artist) return true;

    return false;
  }
  return true;
};

module.exports = {
  login,
  getCloudMusics,
  uploadSong,
};
