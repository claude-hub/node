/*
 * @@Author: zhangyunpeng@sensorsdata.cn
 * @@Description:
 * @Date: 2023-10-07 11:56:50
 * @LastEditTime: 2023-10-09 17:55:37
 */

const fs = require('fs');
const puppeteer = require('puppeteer');
const { downloadMusic } = require('./utils');
const {
  playlist_track_all,
  song_detail,
} = require('NeteaseCloudMusicApi');
const path = require('path');
const { id } = require('./playlist');
const { getCloudMusics, login, uploadSong } = require('./services');

const queryFlacUrl = async (page, name, album) => {

  await page.setRequestInterception(true);
  page.on('request', interceptedRequest => {
    if (interceptedRequest.isInterceptResolutionHandled()) return;
    // 该页面有个谷歌分析的请求。需要拦截掉
    if (
      interceptedRequest.url().includes('googlesyndication.com')
    )
      interceptedRequest.abort();
    else interceptedRequest.continue();
  });

  // 设置页面的URL
  await page.goto(`https://tool.liumingye.cn/music/#/search/M/song/${name}`, {
    waitUntil: 'networkidle0'
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
    cookie
  });
  const { privileges } = res.body;
  const ids = privileges.map((item) => item.id);
  const detail = await song_detail({
    ids: ids.toString(),
    cookie
  });

  const songs = detail.body.songs || [];

  for (let index = 0; index < songs.length; index++) {
    const { name, ar, al, id: songId } = songs[index];
    const singers = ar.map((item) => item.name).toString();
    const fileName = `${singers} - ${name}`;
    // 如果云端有这个歌曲了，则不需要继续去下载了
    if (cloudSongs.includes(name)) {
      console.log('云端已存在: ', fileName)
      continue;
    }
    const filePath = path.resolve(__dirname, `./songs/${fileName}.flac`);

    const exists = fs.existsSync(filePath);
    // 文件存在，则不需要下载
    if (exists) {
      console.log('本地已存在：', fileName)
      // 直接上传
      await uploadSong(cookie, filePath, songId);
      continue;
    }

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
      await downloadMusic(url, filePath);
      // 上传
      await uploadSong(cookie, filePath, songId);
    } catch (e) {
      console.log(e)
      fs.appendFileSync(path.resolve(__dirname, 'error.txt'), `${fileName}\n`);
    }
  }
};

const downlaod = async () => {
  // 创建一个浏览器对象
  const browser = await puppeteer.launch({
    // headless: false,
    headless: 'new',
    // devtools: true,
  });
  // 打开一个新的页面
  const page = await browser.newPage();

  try {
    await queryByIds(page);
  } catch (e) {
    console.log('网络请求出错：', e);
  }

  await browser.close();
};

downlaod();
