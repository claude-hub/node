/*
 * @@Author: zhangyunpeng@sensorsdata.cn
 * @@Description:
 * @Date: 2023-10-08 15:51:58
 * @LastEditTime: 2023-10-09 18:11:51
 */
// 上传整个文件夹
const { getPathFiles } = require('@claude-hub/node-utils');
const path = require('path');
const { login, uploadSong, getCloudMusics } = require('./services');

const upload = async () => {
  try {
    const cookie = await login();
    if (!cookie) return;

    const cloudSongs = await getCloudMusics(cookie);

    const [paths] = getPathFiles(path.resolve(__dirname, './songs'));
    for (let index = 0; index < paths.length; index++) {
      const filePath = paths[index];
      const fileName = path.basename(filePath)
      const formatted = fileName.replace(/\s/g, '');
      const end = formatted.lastIndexOf('.');
      const start = formatted.lastIndexOf('-');
      const name = formatted.substring(start + 1, end);


      const isExists = cloudSongs.includes(name);
      // 如果云端有这个歌曲了，则不需要继续去下载了
      if (isExists) {
        console.log('云端已存在: ', fileName);
        continue;
      }

      if (filePath.includes('.DS_Store')) continue;

      await uploadSong(cookie, filePath);
    }
  } catch (e) {
    console.log(e);
  }
};

upload();
