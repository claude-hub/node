/*
 * @@Author: zhangyunpeng@sensorsdata.cn
 * @@Description:
 * @Date: 2023-09-15 18:54:09
 * @LastEditTime: 2023-09-27 14:58:04
 */
const { neteaseCloudMusic } = require('./NeteaseCloudMusic');
const { downloadMusic, downloadSingle } = require('./download');

// const isDownload = process.argv.includes('--download');

const music = {
  download: downloadMusic,
  single: downloadSingle,
};

const main = async () => {
  const key = process.argv[2];
  const func = music[key.replace('--', '')];
  if (func) {
    await func();
  } else {
    neteaseCloudMusic();
  }
};

main();
