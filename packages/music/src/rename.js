const fs = require('fs');
const path = require('path');
const { getPathFiles } = require('../utils/file');

const folderPath = 'C:\\Users\\Claude\\Music';

(async () => {
  const folder = path.resolve(__dirname, folderPath);

  const [, fileNames] = await getPathFiles(folder);

  for (let index = 0; index < fileNames.length; index++) {
    const fileName = fileNames[index];

    const lastIndex = fileName.lastIndexOf('.');
    if (lastIndex > -1) {
      const name = fileName.substring(0, lastIndex);
      const suffix = fileName.substring(lastIndex);
      const [musicName, singer] = name.split('-');

      if (musicName && singer) {
        const newFileName = `${singer?.trim()} - ${musicName?.trim()}${suffix}`;
        const fullName = path.resolve(folderPath, fileName);
        const newFullName = path.resolve(folderPath, newFileName);
        console.log(fullName, newFullName);

        fs.renameSync(fullName, newFullName);
      }
    }
  }
})();
