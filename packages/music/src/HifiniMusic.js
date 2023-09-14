/**
 * 爬取 www.hifini.com 歌曲，获取到在线 url。
 * 参考：https://github.com/HJrookie/note/blob/main/docs/my/music/parse.js
 */
const fs = require('fs');
const cheerio = require('cheerio');
const axios = require('axios');
const quotedPrintable = require('quoted-printable');
const utf8 = require('utf8');
const path = require('path');

const musics = ['../musics/周杰伦.txt', '../musics/陈奕迅.txt'];

function encodePrintableCode(str) {
  str = quotedPrintable.encode(utf8.encode(str));
  return `https://www.hifini.com/search-${str
    .replace(/ /g, '_20')
    .replace(/\s/g, '')
    .replace(/==/, '=')
    .replace(/=/g, '_')}-1.htm`;
}
function parseHtmlAndGetData(body, singerName) {
  const parser = cheerio.load(body);
  const results = [...parser('.media-body .subject  a')]; //  -
  if (!results.length) {
    return null;
  }
  const resultStrArray = results.map((result) => {
    return {
      link: result.attribs.href ?? '',
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
  singerName = singerName.toLocaleLowerCase().replace(/\./g, '');
  const targetMusic = resultStrArray.find((item) =>
    item.hrefName.toLocaleLowerCase().includes(singerName)
  );

  if (targetMusic) {
    return `https://www.hifini.com/${targetMusic.link}`;
  } else {
    // 选择第一个
    if (resultStrArray.length) {
      return `https://www.hifini.com/${resultStrArray[0].link}`;
    }
    return `null`;
  }
}

function getMusicSrc(body) {
  const parser = cheerio.load(body);
  const scripts = [...parser('#player4 ~ script')];
  let script = scripts[scripts.length - 1];
  let src =
    script?.children?.[0].data
      ?.toString()
      ?.match(/(?<=url\:\s\')(.*)(?=\')/)?.[0] ?? '';
  let musicSrc = src.startsWith('get') ? `https://www.hifini.com/${src}` : src;
  return musicSrc;
}

function getMusciName(line) {
  const splitPint = line.split('.');
  // 先用 . 切割
  if (splitPint.length > 1) {
    return splitPint[1];
  }
  // 再用 - 切割
  const middleLine = splitPint[0].split('-');
  if (middleLine.length > 1) {
    return middleLine[1];
  }
  // 都没有直接返回
  return middleLine[0];
}

const parseJson = (str, defaultV) => {
  try {
    return JSON.parse(str);
  } catch {
    return defaultV || [];
  }
};

const saveMusicUrl = (singerName, musicName, musicSrc, fileName) => {
  const musicPath = `${fileName}.json`;
  // 先判断文件是否存在，不存在则创建
  fs.appendFileSync(path.resolve(__dirname, musicPath), '');

  const musicStr = fs.readFileSync(path.resolve(__dirname, musicPath), 'utf-8');
  let musics = parseJson(musicStr);
  if (musics.length > 0) {
    // 去重
    if (musics.some((item) => item.name === musicName)) {
      return;
    }
    musics = [
      ...musics,
      {
        singer: singerName,
        name: musicName,
        url: musicSrc,
      },
    ];
  } else {
    musics = [
      {
        singer: singerName,
        name: musicName,
        url: musicSrc,
      },
    ];
  }
  fs.writeFileSync(
    path.resolve(__dirname, musicPath),
    JSON.stringify(musics, '', '\t')
  );
  console.log(`==== music ${musicName} save success!`);
};

const queryMusic = async (keywords, singerName) => {
  console.log('====1====', encodePrintableCode(keywords));
  const { data } = await axios(encodePrintableCode(keywords));
  const url = parseHtmlAndGetData(data, singerName || keywords);
  console.log('====2====', url);
  if (!url) {
    return '';
  }

  const { data: html } = await axios(url);

  if (!html) {
    return '';
  }
  const musicSrc = getMusicSrc(html);
  return musicSrc;
};

module.exports = {
  queryMusic,
};
