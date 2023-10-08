// 上传整个文件夹
const { getPathFiles } = require('@claude-hub/node-utils');
const { cloud } = require('NeteaseCloudMusicApi');
const path = require('path');
const { login, uploadSong } = require('./services');


const upload = async () => {
  const cookie = await login();
  if (!cookie) return;

  const [paths] = getPathFiles(path.resolve(__dirname, './songs'));
  for (let index = 0; index < paths.length; index++) {
    const filePath = paths[index];
    if (filePath.includes('.DS_Store')) continue;

    await uploadSong(cookie, filePath)
  }
};

upload();
