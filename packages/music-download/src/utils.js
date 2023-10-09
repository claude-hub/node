/*
 * @@Author: zhangyunpeng@sensorsdata.cn
 * @@Description:
 * @Date: 2023-10-07 15:49:03
 * @LastEditTime: 2023-10-09 12:13:35
 */
const { dirExists } = require('@claude-hub/node-utils');
const { default: axios } = require('axios');
const fs = require('fs');
const path = require('path');

const headers = {
  accept: '*/*',
  'accept-language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
  range: 'bytes=0-',
  'sec-ch-ua':
    '"Chromium";v="106", "Google Chrome";v="106", "Not;A=Brand";v="99"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'audio',
  'sec-fetch-mode': 'no-cors',
  'sec-fetch-site': 'cross-site',
  'Content-Type': 'audio/mp4',
};

const downloadMusic = async (url, filePath) => {
  return new Promise(async (resolve) => {
    const exists = fs.existsSync(filePath);
    // 文件存在，则不需要下载
    if (exists) {
      resolve();
      return;
    }
    console.log('开始下载: ', path.basename(filePath));
    // 创建上层文件夹
    await dirExists(filePath);
    const { data } = await axios({
      url: encodeURI(url),
      method: 'get',
      headers,
      timeout: 10000,
      responseType: 'stream',
    });
    if (!data.responseUrl) return '';

    const writeStream = fs.createWriteStream(filePath, {
      flags: 'w',
      autoClose: true,
    });

    data
      .pipe(writeStream)
      .on('close', async () => {
        resolve();
      })
      .on('error', async () => {
        return resolve();
      });
  });
};

module.exports = { downloadMusic };
