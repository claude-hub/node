/*
 * @@Author: claudez1115@gmail.com
 * @@Description: 下载音乐
 * @Date: 2023-09-11 16:46:05
 * @LastEditTime: 2023-09-27 19:34:16
 */

const {
  queryArtists,
  queryArtistSongs,
  serachMusic,
} = require('./NeteaseCloudMusic');
const { downloadMp3 } = require('./service');
const sheet = require('./musics');

const downloadMusic = async () => {
  const artists = await queryArtists();
  for (let index = 0; index < artists.length; index++) {
    const artist = artists[index];
    const { id: artistId, name: artistName } = artist;

    const musics = await queryArtistSongs(artistId);
    for (let i = 0; i < musics.length; i++) {
      const { id, name } = musics[i];
      await downloadMp3(id, artistName, name);
    }
  }
};

const downloadSingle = async () => {
  for (let index = 0; index < sheet.length; index++) {
    const keywords = sheet[index];
    const music = await serachMusic(keywords);
    if (music) {
      const { id, name, artists = [] } = music;
      const artistName = artists[0]?.name || '';
      await downloadMp3(id, artistName, name, false);
    }
  }
};

module.exports = {
  downloadMusic,
  downloadSingle,
};
