/*
 * @@Author: zhangyunpeng@sensorsdata.cn
 * @@Description:
 * @Date: 2023-10-08 17:26:12
 * @LastEditTime: 2023-10-08 18:42:13
 */
const {
  user_cloud,
  login_cellphone,
  login_refresh,
  cloud,
} = require('NeteaseCloudMusicApi');
const fs = require('fs');
const path = require('path');

const cookiePath = path.resolve(__dirname, 'cookie.txt');

const login = async () => {
  const oldCookie = fs.readFileSync(cookiePath);
  return oldCookie;

  // try {
  //   const res = await login_refresh({
  //     cookie: oldCookie,
  //   });
  //   const cookie = res.cookie?.[0] || '';
  //   fs.writeFileSync(cookiePath, cookie);
  //   return cookie;
  // } catch (e) {
  //   console.log(e);
  //   return '';
  // }

  // try {
  //   const result = await login_cellphone({
  //     phone: '',
  //     password: '',
  //   });
  //   const { cookie = '' } = result.body;
  //   return cookie;
  // } catch (e) {
  //   console.log(e);
  //   return '';
  // }
};

const getCloudMusics = async (cookie) => {
  const result = await user_cloud({
    limit: 10000,
    cookie,
  });

  return result.body.data?.map((item) => item.simpleSong.name) || [];
};

const uploadSong = async (cookie, filePath) => {
  console.log(path.basename(filePath));
  try {
    const res = await cloud({
      songFile: {
        name: path.basename(filePath),
        data: fs.readFileSync(filePath),
      },
      cookie,
    });
    if (res.body.code === 200) {
      console.log('==上传成功==', res.body.privateCloud.fileName);
    } else {
      console.log(res);
    }
  } catch (e) {
    console.log(e);
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
