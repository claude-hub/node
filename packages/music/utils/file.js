/*
 * @@Author: zhangyunpeng@sensorsdata.cn
 * @@Description: 
 * @Date: 2023-09-05 18:31:52
 * @LastEditTime: 2023-09-11 19:36:00
 */
const fs = require('fs');
const path = require('path');

/**
 * 判断路径是否存在
 * @param {*} path
 * @returns
 */
const getStat = (path) => {
  return new Promise((resolve) => {
    fs.stat(path, (err, stats) => {
      if (err) {
        resolve(false);
      } else {
        resolve(stats);
      }
    });
  });
};

/**
 * 创建路径
 * @param {string} dir 路径
 */
const mkdir = (dir) => {
  return new Promise((resolve) => {
    fs.mkdir(dir, (err) => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
};

/**
 * 路径是否存在，不存在则创建
 * @param {string} dir 路径
 */
const createPath = async (filePath = '', createFile = true) => {
  const isExists = await getStat(filePath);
  //如果存在该路径返回true
  if (isExists) {
    return true;
  }

  const [lastPath] = filePath.split('/').reverse();
  let dirPath = filePath;
  const isFilePath = lastPath.includes('.');
  if (isFilePath) {
    dirPath = filePath.slice(0, filePath.length - lastPath.length - 1);
  }

  const dirExists = async (dirPath) => {
    const isExists = await getStat(dirPath);
    //如果存在该路径返回true
    if (isExists) {
      return true;
    }
    // 如果该路径不存在
    let tempDir = path.parse(dirPath).dir; //拿到上级路径
    //递归判断，如果上级目录也不存在，则会代码会在此处继续循环执行，直到目录存在
    let status = await dirExists(tempDir);
    let mkdirStatus;
    if (status) {
      mkdirStatus = await mkdir(dirPath);
    }
    return mkdirStatus;
  };

  await dirExists(dirPath);

  // 如果是文件，则尝试写入，写入时，如果文件不存在则会创建
  if (isFilePath && createFile) {
    fs.appendFileSync(filePath, '');
  }
};

/**
 * 写入文件
 * @param {*} filePath
 * @param {*} data
 */
const writeFile = async (filePath, data) => {
  await createPath(filePath);
  fs.writeFileSync(
    filePath,
    JSON.stringify(data, '', '\t')
  );
};

module.exports = {
  createPath,
  writeFile,
};
