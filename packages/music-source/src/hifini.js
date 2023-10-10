/*
 * @@Author: zhangyunpeng@sensorsdata.cn
 * @@Description: 爬取 www.hifini.com 歌曲，获取到在线 url。
 * 参考：https://github.com/HJrookie/note/blob/main/docs/my/music/parse.js
 * @Date: 2023-09-15 14:54:17
 * @LastEditTime: 2023-10-10 17:20:33
 */
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');
const quotedPrintable = require('quoted-printable');
const utf8 = require('utf8');

/**
 * 搜索音乐，跳转的路由
 * @param str
 * @returns
 */
const encodePrintableCode = (str) => {
  str = quotedPrintable.encode(utf8.encode(str));
  return `https://www.hifini.com/search-${str
    .replace(/ /g, '_20')
    .replace(/\s/g, '')
    .replace(/==/, '=')
    .replace(/=/g, '_')}-1.htm`;
};

/**
 * 解析搜索到的歌曲列表
 * @param {*} body
 * @param {*} user
 * @returns
 */
const parseHtmlAndGetData = (body) => {
  const parser = cheerio.load(body);
  const results = [...parser('.media-body .subject  a')];
  if (!results.length) {
    return [];
  }
  const musics = results.map((result) => {
    const link = result.attribs.href;
    return {
      link: link ? `https://www.hifini.com/${link}` : '',
      hrefName: [...result.children]
        .reduce((prev, cur) => {
          if ('children' in cur) {
            return prev + cur.children[0].data;
          }
          return prev + cur.data;
        }, '')
        .replace(/\./g, ''),
    };
  });
  return musics;
};

/**
 * 解析音乐列表
 * @param body
 */
const getMusicSrc = (body) => {
  const parser = cheerio.load(body);
  const scripts = [...parser('#player4 ~ script')];
  const script = scripts[scripts.length - 1];
  const src =
    script?.children[0].data.toString().match(/(?<=url:\s')(.*)(?=')/)[0] || '';
  const musicSrc = src.startsWith('get')
    ? `https://www.hifini.com/${src}`
    : src;
  return musicSrc;
};


const openBrowser = async (url) => {
  // 创建一个浏览器对象
  const browser = await puppeteer.launch({
    headless: false,
    // headless: 'new',
    // devtools: true,
  });
  // 打开一个新的页面
  const page = await browser.newPage();
  // 设置页面的URL
  await page.goto('https://www.hifini.com/', {
    waitUntil: 'networkidle0',
  });
  const cookie = {
    name: 'de246d5440af7315f5ca72cdada386ca',
    value: 'e09e811a766638b9e7191f76a0185a57',
    domain: 'www.hifini.com',
    path: '/',
  }
  await page.setCookie(cookie)
  // 设置页面的URL
  await page.goto(url, {
    waitUntil: 'networkidle0',
  });
  const html = await page.evaluate(async () => {
    return document.getElementsByTagName('html')[0].innerHTML;
  });
  await browser.close();

  return html;
}

const queryHifiniMusic = async (query) => {

  

  const res = await axios(encodePrintableCode(query));
  // 搜索到的，所有的音乐列表
  const musics = parseHtmlAndGetData(res.data);

  for (let index = 0; index < musics.length; index++) {
    const musicSrc = musics[index].link;
    if (musicSrc) {
      const { data } = await axios(musicSrc);
      let html = data;
      if (html.includes('机身份验证')) {
        html = await openBrowser(musicSrc);
      }

      if(!html) return;

      const src = await getMusicSrc(html);
      if (src) {
        return src;
      }
    }
  }
};

module.exports = queryHifiniMusic;
