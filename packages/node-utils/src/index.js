/*
 * @@Author: zhangyunpeng@sensorsdata.cn
 * @@Description:
 * @Date: 2023-09-05 18:31:52
 * @LastEditTime: 2023-10-08 15:23:09
 */
const fs = require('fs');
const path = require('path');
const join = require('path').join;

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
const dirExists = async (dir) => {
  let isExists = await getStat(dir);
  //如果存在该路径且不是文件，返回true
  if (isExists && isExists.isDirectory()) {
    return true;
  } else if (isExists) {
    //如果该路径存在但是文件，返回false
    return false;
  }
  //如果该路径不存在
  let tempDir = path.parse(dir).dir; //拿到上级路径
  //递归判断，如果上级目录也不存在，则会代码会在此处继续循环执行，直到目录存在
  let status = await dirExists(tempDir);
  let mkdirStatus;
  // 如果路径包含了 . 则默认不创建
  if (status && !dir.includes('.')) {
    mkdirStatus = await mkdir(dir);
  }
  return mkdirStatus;
};

/**
 * 获取指定路径下的所有文件，包含子文件
 * @param {string} path 路径
 * @param {[]} excludeFolder 排除的文件夹
 * @returns 文件数组
 */
const getPathFiles = (path, excludeFolder = []) => {
  const jsonFiles = [];

  const findFile = (path) => {
    const files = fs.readdirSync(path);
    files.forEach((item) => {
      if (excludeFolder.includes(item)) {
        // 继续往下执行
        return;
      }
      const fPath = join(path, item);
      const stat = fs.statSync(fPath);
      if (stat.isDirectory() === true) {
        findFile(fPath);
      }
      if (stat.isFile() === true) {
        jsonFiles.push(fPath);
      }
    });
  };
  findFile(path);
  return jsonFiles;
};

module.exports = {
  dirExists,
  getPathFiles,
};
