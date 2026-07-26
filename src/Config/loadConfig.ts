import fs from 'fs';

const configPath = "./config/config.json";

let baseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as UserConfig;


function getServerConfigList() {
  return baseConfig.Servers;
}

function getAccountList() {
  return baseConfig.Users;
}

function getAccountInfo(account: string) {
  const accountInfo = baseConfig.Users[account];
  if (!accountInfo) {
    throw new Error(`Not found account "${account}".\nAvailable Accounts: ${Object.keys(baseConfig.Users).join(', ')}`);
  }

  return accountInfo;
}

function getServerNameList() {
  return Object.keys(baseConfig.Servers);
}

function getServerInfo(server: string) {
  const serverInfo = baseConfig.Servers[server];
  if (!serverInfo) {
    throw new Error(`Not found server "${server}".\nAvailable Servers: ${Object.keys(baseConfig.Servers).join(', ')}`);
  }

  return serverInfo;
}

function getAccountNameList() {
  return Object.keys(baseConfig.Users);
}

function getMainAccount() {
  return baseConfig.mainAccount;
}

function isAdmin(user: string) {
  return baseConfig.Admin.includes(user);
}

function isInAutoAcceptTpaList(user: string) {
  return baseConfig.autoAcceptTpaList.includes(user);
}

function reloadConfig() {
  baseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as UserConfig;
}

export {
  getServerConfigList,
  getAccountList,
  getAccountInfo,
  getServerNameList,
  getServerInfo,
  getAccountNameList,
  getMainAccount,
  isAdmin,
  isInAutoAcceptTpaList,
  reloadConfig
}