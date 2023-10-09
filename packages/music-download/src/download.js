/*
 * @@Author: zhangyunpeng@sensorsdata.cn
 * @@Description:
 * @Date: 2023-10-07 11:56:50
 * @LastEditTime: 2023-10-09 11:35:06
 */

const fs = require('fs');
const puppeteer = require('puppeteer');
const { downloadMusic } = require('./utils');
const {
  playlist_track_all,
  song_detail,
  user_cloud,
} = require('NeteaseCloudMusicApi');
const path = require('path');
const { id } = require('./playlist');
const { getCloudMusics, login, uploadSong } = require('./services');

const queryFlacUrl = async (page, name, album) => {
  // 设置页面的URL
  await page.goto(`https://tool.liumingye.cn/music/#/search/M/song/${name}`, {
    // 该页面有个谷歌分析的请求。networkidle2 只有两个网络请求的时候触发，就避免了谷歌分析的请求
    waitUntil: 'networkidle2'
  });

  const url = await page.evaluate(
    async ({ name, album }) => {
      const webTimeout = (delay) => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            try {
              resolve(1);
            } catch (e) {
              reject(0);
            }
          }, delay);
        });
      };

      const list = document.querySelectorAll('.item');

      for (let index = 0; index < list.length; index++) {
        const item = list[index];

        const cells = item.querySelectorAll('.truncate');

        const [titleNode, singerNode, albumNode] = [...cells];

        const titleHtml = titleNode.querySelector('.text-sm')?.innerHTML;

        const _title = titleHtml
          .replace(/<mark>/g, '')
          .replace(/<\/mark>/g, '')
          .trim();

        const _singers = singerNode.querySelectorAll('.cursor-pointer');
        const _album = albumNode.querySelector('.cursor-pointer')?.innerText;
        const singers = [];
        for (let i = 0; i < _singers.length; i++) {
          singers.push(_singers[i].innerText);
        }
        if (name === _title && _album === album) {
          const moreBtn = item.querySelector('.arco-btn');
          moreBtn.click();

          const wrapper = document.querySelector('.mx-menu-ghost-host');
          const actions = wrapper.querySelectorAll('.mx-context-menu-item');

          const downlaodBtn = [...actions].pop();

          if (downlaodBtn.querySelector('span').innerText === '下载') {
            downlaodBtn.click();
            await webTimeout(20);

            const musicSources = document.querySelectorAll(
              '.arco-overlay-modal .arco-space-item a'
            );
            for (let i = 0; i < musicSources.length; i++) {
              const sourceNode = musicSources[i];
              if (sourceNode.innerText === '无损flac') {
                return sourceNode.href;
              }
            }
          }
        }
      }
    },
    { name, album }
  );
  if (!url) {
    return '';
  }

  await page.goto(url, {
    waitUntil: 'networkidle0',
  });

  const ifrmeUrl = await page.evaluate(async () => {
    return document.querySelector('iframe')?.src;
  });

  await page.goto(ifrmeUrl, {
    waitUntil: 'networkidle0',
  });

  const musicUrl = await page.evaluate(async () => {
    const url = document.querySelector('a')?.href;
    return url;
  });
  return musicUrl;
};

const queryByIds = async (page) => {
  const cookie = await login();
  if (!cookie) return;
  const cloudSongs = await getCloudMusics(cookie);

  const res = await playlist_track_all({
    id,
  });

  const { privileges } = res.body;
  const ids = privileges.map((item) => item.id);

  const detail = await song_detail({
    ids: ids.toString(),
  });

  const songs = detail.body.songs || [];

  for (let index = 0; index < songs.length; index++) {
    const { name, ar, al } = songs[index];
    // 如果云端有这个歌曲了，则不需要继续去下载了
    if (cloudSongs.includes(name)) continue;

    const singers = ar.map((item) => item.name).toString();
    const fileName = `${singers} - ${name}`;
    const filePath = path.resolve(__dirname, `./songs/${fileName}.flac`);

    const exists = fs.existsSync(filePath);
    // 文件存在，则不需要下载
    if (exists) continue;

    const url = await queryFlacUrl(page, name, al.name);
    if (!url) {
      // ==没找到无损flac音乐==
      fs.appendFileSync(
        path.resolve(__dirname, 'no_flac.txt'),
        `${fileName}\n`,
        'utf-8'
      );
      continue;
    }

    try {
      // 下载
      console.log('====开始下载')
      await downloadMusic(url, filePath);
      console.log('====开始上传')
      // 上传
      await uploadSong(cookie, filePath);
    } catch (e) {
      console.log(e)
      fs.appendFileSync(path.resolve(__dirname, 'error.txt'), `${fileName}\n`);
    }
  }
};

const downlaod = async () => {
  // 创建一个浏览器对象
  const browser = await puppeteer.launch({
    // headless: false
    headless: 'new',
    // devtools: true,
  });
  // 打开一个新的页面
  const page = await browser.newPage();

  try {
    await queryByIds(page);
  } catch (e) {
    console.log(e);
  }

  await browser.close();
};

downlaod();
