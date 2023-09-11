const { neteaseCloudMusic, downloadMusic } = require('./NeteaseCloudMusic');

const isDownload = process.argv.includes('--download');

const main = async () => {
  if (isDownload) {
    downloadMusic();
  }
}

main();
