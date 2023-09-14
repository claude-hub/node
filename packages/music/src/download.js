/*
 * @@Author: claudez1115@gmail.com
 * @@Description: 下载音乐
 * @Date: 2023-09-11 16:46:05
 * @LastEditTime: 2023-09-11 19:39:28
 */

const { default: axios } = require('axios');
const fs = require('fs');
const path = require('path');
const {
  queryArtists,
  queryArtistSongs,
  queryLyric,
} = require('./NeteaseCloudMusic');
const { createPath } = require('../utils/file');
const { queryMusic } = require('./HifiniMusic');

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

const downloadNeteaseCloudMusic = async (url) => {
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
  fs.writeFileSync(filePath, lyric, 'utf-8');
};

const downloadMp3 = async (id, artistName, name) => {
  return new Promise(async (resolve, reject) => {
    setTimeout(async () => {
      try {
        if (!id || !artistName || !name) {
          return resolve();
        }
        console.log('====0====', `${artistName}-${name}.mp3`);
        const url = `https://music.163.com/song/media/outer/url?id=${id}.mp3`;
        let musicPath = `../songs/${artistName}/${artistName}-${name}.mp3`;
        const filePath = path.resolve(__dirname, musicPath);
        const exists = fs.existsSync(filePath);
        const lrcPath = filePath.replace('.mp3', '.lrc');
        if (exists) {
          if (fs.existsSync(lrcPath)) {
            return resolve();
          } else {
            await downloadLrc(id, lrcPath);
          }
          return resolve();
        }

        let data = await downloadNeteaseCloudMusic(url);
        if (!data) {
          // 去 hifini.com 下载
          const src = await queryMusic(`${artistName}${name}`, artistName);
          data = await downloadNeteaseCloudMusic(src);
          // musicPath = `../songs/${artistName}/${name}.mp3`;
          if (!data) return resolve();
        }

        await createPath(filePath.replace(`${artistName}-${name}.mp3`, ''));

        const writeStream = fs.createWriteStream(filePath, {
          flags: 'w',
          autoClose: true,
        });
        data.pipe(writeStream).on('close', async () => {
          // console.log('====3====', filePath);
          await downloadLrc(id, lrcPath);
          // console.log('====4====');
          resolve();
        });
      } catch (e) {
        console.log('====err====', `${artistName}-${name}.mp3`);
        resolve(e);
      }
    }, 1000);
  });
};

const downloadMusic = async () => {
  const artists = await queryArtists();
  for (let index = 0; index < 1; index++) {
    const artist = artists[index];
    const { id: artistId, name: artistName } = artist;
    if (artistName === '刘大拿') continue;
    const musics = await queryArtistSongs(artistId);
    for (let i = 0; i < musics.length; i++) {
      const { id, name } = musics[i];
      await downloadMp3(id, artistName, name);
    }
  }
};

module.exports = downloadMusic;
