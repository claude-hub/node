/*
 * @@Author: zhangyunpeng@sensorsdata.cn
 * @@Description: 音乐换源 API
 * @Date: 2023-09-15 18:32:05
 * @LastEditTime: 2023-09-18 11:14:13
 */
const hifini = require('./hifini');

const queryMusic = async (query) => {
  return await hifini(query);
};

module.exports = queryMusic, {
  hifini,
};
