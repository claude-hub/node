/*
 * @@Author: zhangyunpeng@sensorsdata.cn
 * @@Description:
 * @Date: 2023-10-07 11:56:50
 * @LastEditTime: 2023-10-07 18:11:44
 */

const puppeteer = require('puppeteer');
const { downloadMusic } = require('./utils');
const { playlist_track_all, song_detail } = require('NeteaseCloudMusicApi');

const queryFlacUrl = async (page) => {
  // 设置页面的URL
  await page.goto(
    'https://tool.liumingye.cn/music/#/search/M/song/%E7%A8%BB%E9%A6%99'
  );

  const url = await page.evaluate(async () => {
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

      const _title = titleNode.querySelector('mark')?.innerText;
      const _singers = singerNode.querySelectorAll('.cursor-pointer');
      const _album = albumNode.querySelector('.cursor-pointer')?.innerText;
      const singers = [];
      for (let i = 0; i < _singers.length; i++) {
        singers.push(_singers[i].innerText);
      }

      if (index === 1) {
        console.log(_title, singers, _album);
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
  });
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
    window.open(url);
    return url;
  });
  return musicUrl;
};

const downlaod = async () => {
  // 创建一个浏览器对象
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
  });
  // 打开一个新的页面
  const page = await browser.newPage();
  page.setViewport({
    width: 1480,
    height: 780,
  });

  const url = await queryFlacUrl(page);

  // try {
  //   await downloadMusic(url, '周杰伦 - 稻香.flac');
  // } catch (e) {
  //   console.log(e);
  // }

  // await browser.close();
};

// downlaod();

const queryByIds = async () => {
  const res = await playlist_track_all({
    id: 8787091946,
  })

  const { privileges } = res.body
  const ids = privileges.map((item) => item.id)

  const detail = await song_detail({
    ids: ids.toString(),
  })

  console.log(JSON.stringify(detail))
}

queryByIds();

