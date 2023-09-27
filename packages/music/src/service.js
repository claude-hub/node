const { default: axios } = require('axios');
const fs = require('fs');
const path = require('path');
const queryMusic = require('@claude-hub/music-source');
const { queryLyric } = require('./NeteaseCloudMusic');
const { createPath } = require('../utils/file');

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

const downloadMusicStream = async (url) => {
  const { data } = await axios({
    url: encodeURI(url),
    method: 'get',
    headers,
    timeout: 10000,
    responseType: 'stream',
  });
  if (!data.responseUrl) return '';
  return data;
};

const downloadLrc = async (id, filePath) => {
  const lyric = await queryLyric(id);
  try {
    fs.writeFileSync(filePath, lyric, 'utf-8');
  } catch {
    console.log('-----写歌词失败-----');
  }
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
    }, 3_000);
  });
};

const downloadMp3 = async (id, artistName, name, lrc = true) => {
  return new Promise(async (resolve) => {
    try {
      if (!id || !artistName || !name) {
        return resolve();
      }
      // console.log('====0====', `${artistName}-${name}.mp3`);
      const url = `https://music.163.com/song/media/outer/url?id=${id}.mp3`;
      let musicPath = `../songs/${artistName}/${artistName} - ${name}.mp3`;
      if (!lrc) {
        musicPath = `../songs/${artistName} - ${name}.mp3`;
      }
      const filePath = path.resolve(__dirname, musicPath);
      const exists = fs.existsSync(filePath);
      const lrcPath = filePath.replace('.mp3', '.lrc');
      if (exists && lrc) {
        if (fs.existsSync(lrcPath)) {
          return resolve();
        } else {
          await downloadLrc(id, lrcPath);
        }
        return resolve();
      }

      let data = await downloadMusicStream(url);
      if (!data) {
        console.log('====hifini====', `${artistName}-${name}.mp3`);
        // 去 hifini.com 下载
        const src = await downloadHifini(name);
        if (!src) {
          console.log('=====无此歌曲====', `${artistName}-${name}.mp3`);
          return resolve();
        }
        data = await downloadMusicStream(src);
        // musicPath = `../songs/${artistName}/${name}.mp3`;
        if (!data) return resolve();
      }

      await createPath(filePath.replace(`${artistName} - ${name}.mp3`, ''));

      const writeStream = fs.createWriteStream(filePath, {
        flags: 'w',
        autoClose: true,
      });
      data
        .pipe(writeStream)
        .on('close', async () => {
          if (lrc) {
            await downloadLrc(id, lrcPath);
          }
          resolve();
        })
        .on('error', async () => {
          return resolve();
        });
    } catch (e) {
      console.log('====err====', `${artistName}-${name}.mp3`);
      resolve();
    }
  });
};

module.exports = {
  downloadMp3,
};
