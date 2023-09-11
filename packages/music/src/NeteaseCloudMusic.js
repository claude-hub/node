const fs = require('fs');
const path = require('path');
const request = require('../utils/request');
const { createPath } = require('../utils/file');

/**
 * 查询歌词
 * @param {*} id
 * @returns
 */
const queryLyric = async (id) => {
  const data = {
    id,
    tv: -1,
    lv: -1,
    rv: -1,
    kv: -1,
  };
  const res = await request(
    'POST',
    `https://music.163.com/api/song/lyric?_nmclfl=1`,
    data,
    {
      crypto: 'api',
    }
  );
  return res.body?.lrc?.lyric || '';
};

/**
 * 获取歌手 热门 50 首
 * @param {number} id
 * @returns
 */
const queryArtistSongs = async (id) => {
  // 全部歌曲
  // const data = {
  //   id,
  //   private_cloud: 'true',
  //   work_type: 1,
  //   order: 'hot', //hot,time
  //   offset: 0,
  //   limit: 1000,
  // }
  // const res = await request('POST', `https://music.163.com/api/v1/artist/songs`, data, {
  //   crypto: 'weapi',
  // })
  // 热门 50 首
  const data = {
    id,
  };
  const res = await request(
    'POST',
    `https://music.163.com/api/artist/top/song`,
    data,
    {
      crypto: 'weapi',
    }
  );
  const { songs = [] } = res.body;
  const list = songs.map((item) => {
    const { name = '', id, al = {}, ar = [], dt } = item;
    return {
      id,
      name,
      ar: ar.map(({ name }) => ({ name })),
      dt,
      al: {
        picUrl: al.picUrl,
      },
    };
  });

  return list;
};

/**
 * 获取所有的热门歌手数据
 */
const queryArtists = async () => {
  const data = {
    limit: 200,
    offset: 0,
    total: true,
  };
  const result = await request(
    'POST',
    `https://music.163.com/weapi/artist/top`,
    data,
    {
      crypto: 'weapi',
    }
  );

  const { artists = [] } = result.body;
  return artists;
};

/**
 * 把音乐信息写入文件
 * @param {*} filePath
 * @param {*} data
 */
const writeFile = async (filePath, data) => {
  const musicPath = path.join(__dirname, filePath);

  await createPath(musicPath);

  fs.writeFileSync(
    path.resolve(__dirname, musicPath),
    JSON.stringify(data, '', '\t')
  );
};

/**
 * 解析网易云音乐
 */
const neteaseCloudMusic = async () => {
  const artists = await queryArtists();

  for (let index = 0; index < artists.length; index++) {
    const artist = artists[index];
    const { id: artistId, name: artistName } = artist;
    const songs = await queryArtistSongs(artistId);

    const info = songs.map(async (song) => {
      const { id: songId } = song;
      const lyric = await queryLyric(songId);
      return {
        ...song,
        lyric,
      };
    });
    const musics = await Promise.all(info);

    await writeFile(`../musics/artists/${artistName}.json`, musics);
  }
  const singers = artists.map((artist) => {
    const { name, picUrl } = artist;
    return { name, picUrl };
  });

  await writeFile(`../musics/artists/index.json`, singers);
};

const downloadMusic = () => {
};

module.exports = {
  neteaseCloudMusic,
  downloadMusic,
};
