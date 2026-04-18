import mineflayer from 'mineflayer';
import fs from 'fs';

declare module 'mineflayer' {
  interface Bot {
    configDir: string;
    privateDir: string;
    configMap: Record<string, any>;
    saveConfig: (namespace: string, data: Record<string, any>, isPrivate?: boolean) => void;
    loadConfig: (namespace: string, defaultData: Record<string, any>) => Record<string, any>;
    getConfig: (namespace: string, key: string) => any | undefined;
    setConfig: (namespace: string, key: string, value: any, isPrivate?: boolean) => void;
  }
}

function saveConfig(bot: mineflayer.Bot, namespace: string, data: Record<string, any>, isPrivate?: boolean) {
  isPrivate = isPrivate ?? false;

  if (!fs.existsSync(bot.configDir)) {
    fs.mkdirSync(bot.configDir);
  }
  let configPath = `${bot.configDir}/${namespace}.json`;
  if (isPrivate) {
    if (!fs.existsSync(bot.privateDir)) {
      fs.mkdirSync(bot.privateDir);
    }
    configPath = `${bot.privateDir}/${namespace}.json`;
  }
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
}

function loadConfig(bot: mineflayer.Bot, namespace: string, defaultData: Record<string, any>) {
  const baseConfigPath = `${bot.configDir}/${namespace}.json`;
  const privatePath = `${bot.privateDir}/${namespace}.json`;

  let data: Record<string, any> = {};
  if (fs.existsSync(baseConfigPath)) {
    data = JSON.parse(fs.readFileSync(baseConfigPath, 'utf8'));
  } else {
    fs.writeFileSync(baseConfigPath, JSON.stringify(defaultData, null, 2));
  }
  if (fs.existsSync(privatePath)) {
    data = {...defaultData, ...data, ...JSON.parse(fs.readFileSync(privatePath, 'utf8'))};
  }
  bot.configMap[namespace] = data;
  return data;
}

function getConfig(bot: mineflayer.Bot, namespace: string, key: string) {
  return bot.configMap[namespace]?.[key];
}

function setConfig(bot: mineflayer.Bot, namespace: string, key: string, value: any, isPrivate?: boolean) {
  isPrivate = isPrivate ?? false;
  bot.configMap[namespace][key] = value;

  if (isPrivate) {
    const privateDir = `${bot.configDir}/${bot.username}`;
    if (!fs.existsSync(privateDir)) {
      fs.mkdirSync(privateDir);
    }
    const privatePath = `${privateDir}/${namespace}.json`;
    if (!fs.existsSync(privateDir)) {
      fs.mkdirSync(privateDir);
    }
    if (!fs.existsSync(privatePath)) {
      fs.writeFile(privatePath, JSON.stringify({key: value}, null, 2), () => {});
      return;
    }
    const privateData = JSON.parse(fs.readFileSync(privatePath, 'utf8'));
    privateData[key] = value;
    fs.writeFile(privatePath, JSON.stringify(privateData, null, 2), () => {});
    return;
  }


  const baseConfigPath = `${bot.configDir}/${namespace}.json`;
  if (!fs.existsSync(baseConfigPath)) {
    fs.writeFile(baseConfigPath, JSON.stringify({key: value}, null, 2), () => {});
    return;
  }
  const baseData = JSON.parse(fs.readFileSync(baseConfigPath, 'utf8'));
  baseData[key] = value;
  fs.writeFile(baseConfigPath, JSON.stringify(baseData, null, 2), () => {});
}


export default function inject(bot: mineflayer.Bot) {
  bot.configDir = './config';
  bot.privateDir = `${bot.configDir}/${bot.username}`;
  bot.configMap = {};

  bot.saveConfig = (namespace, data, isPrivate) => saveConfig(bot, namespace, data, isPrivate);
  bot.loadConfig = (namespace, defaultData) => loadConfig(bot, namespace, defaultData);
  bot.getConfig = (namespace, key) => getConfig(bot, namespace, key);
  bot.setConfig = (namespace, key, value, isPrivate) => setConfig(bot, namespace, key, value, isPrivate);
}

