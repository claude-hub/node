/*
 * @@Author: zhangyunpeng@sensorsdata.cn
 * @@Description: 选择独立包发布
 * https://juejin.cn/post/7012622147726082055
 * @Date: 2023-09-15 15:38:31
 * @LastEditTime: 2023-09-15 17:07:59
 */
const globby = require('globby');
const inquirer = require('inquirer');
const fs = require('fs-extra');
const handlebars = require('handlebars');
const execa = require('execa');
const cwd = process.cwd();

const getPackagePath = () => {
  const packagePaths = globby.sync('../packages', {
    cwd: __dirname,
    onlyDirectories: true,
    deep: 1,
  });
  return packagePaths.map((item) => item.replace('../', ''));
};

const choosePackage = async (packages) => {
  const answer = await inquirer.prompt({
    type: 'checkbox',
    name: 'packages',
    message: '选择你要发布的包',
    choices: [...packages],
  });
  return answer;
};

const reWriteLerna = (packages) => {
  const jsonContent = fs.readFileSync(`${cwd}/lerna-template.txt`, 'utf-8');
  const jsonResult = handlebars.compile(jsonContent)(packages);
  fs.writeFileSync(`${cwd}/lerna.json`, jsonResult);
};

const publish = async () => {
  const packages = getPackagePath();
  const publishPackages = await choosePackage(packages);
  if (publishPackages.packages.length !== 0) {
    reWriteLerna(publishPackages);
    execa.commandSync('npx lerna publish', {
      stdio: 'inherit',
      cwd,
    });
  } else {
    console.log('没有选择包');
  }
};

publish();
