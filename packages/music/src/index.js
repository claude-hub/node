const { neteaseCloudMusic } = require('./NeteaseCloudMusic');
const downloadMusic = require('./download');

const isDownload = process.argv.includes('--download');

const main = async () => {
  if (isDownload) {
    downloadMusic();
  } else {
    neteaseCloudMusic();
  }
};

main();
