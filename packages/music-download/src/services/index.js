/*
 * @@Author: zhangyunpeng@sensorsdata.cn
 * @@Description:
 * @Date: 2023-10-08 17:26:12
 * @LastEditTime: 2023-10-09 12:07:41
 */
const { user_cloud, login_cellphone, cloud } = require('NeteaseCloudMusicApi');
const fs = require('fs');
const path = require('path');

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
  const result = await user_cloud({
    limit,
    cookie,
  });

  return result.body.data?.map((item) => item.simpleSong.name) || [];
};

const uploadSong = async (cookie, filePath) => {
  try {
    const res = await cloud({
      songFile: {
        name: path.basename(filePath),
        data: fs.readFileSync(filePath),
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
      `上传失败: ${filePath}\n`,
      'utf-8'
    );
  }
};

module.exports = {
  login,
  getCloudMusics,
  uploadSong,
};
