import fs from 'fs';
import CmdUtil from '../utils/CmdParser.js';
import mineflayer from 'mineflayer';
import { pluginReady, wait } from '../utils/pluginWaiter.js';


function parseTimeStr(time: string) {
  const timeArr = time.replace(' ', '-').split('-');
  if (!timeArr[0] || !timeArr[1] || !timeArr[2]) {
    throw new Error('Invalid time format');
  }
  const year = parseInt(timeArr[0]);
  const month = parseInt(timeArr[1]);
  const day = parseInt(timeArr[2]);
  return { year, month, day };
}

function pad(num: number, length: number = 2, char: string = '0') {
  return num.toString().padStart(length, char);
}

function getTimeStr(dateSep: string = '-', timeSep: string = ':') {
  const date = new Date();
  const time =
    `${date.getFullYear()}${dateSep}${pad(date.getMonth() + 1)}${dateSep}${pad(date.getDate())} ${pad(date.getHours())}${timeSep}${pad(date.getMinutes())}${timeSep}${pad(date.getSeconds())}`;
  return time;
}

function saveLog(bot: mineflayer.Bot, msg: string) {
  msg = msg.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');

  const latestLogFile = getLatestLogFile(bot.logDir, bot.logFile, bot.maxLogSize);
  const date = parseTimeStr(latestLogFile.replace('.log', ''));
  const currentDate = new Date();
  if (date.day !== currentDate.getDate() ||
    date.month !== currentDate.getMonth() + 1 ||
    date.year !== currentDate.getFullYear()) {
    bot.logFile = `${getTimeStr('-', '-')}.log`;
    fs.writeFile(`${bot.logDir}/${bot.logFile}`, msg + '\n', (err) => {
      err && console.error('Write log error:', err, `[${bot.logDir}/${bot.logFile}]`);
    });
    return;
  }
  
  fs.appendFile(`${bot.logDir}/${bot.logFile}`, msg + '\n', (err) => {
    err && console.error('Write log error:', err, `[${bot.logDir}/${bot.logFile}]`);
  });
}

function getLatestLogFile(logDir: string, preLogFile: string, maxLogSize: number) {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }
  if (preLogFile) {
    const prePath = `${logDir}/${preLogFile}`;
    if (!fs.existsSync(prePath)) {
      fs.writeFileSync(prePath, '');
      return preLogFile;
    }

    if (fs.statSync(prePath).size < maxLogSize) {
      return preLogFile;
    }
  }

  const files = fs.readdirSync(logDir).filter((file) => file.endsWith('.log'));
  let latestModTime = 0;
  let currentLogFile = '';
  for (const file of files) {
    const filePath = `${logDir}/${file}`;
    if (fs.statSync(filePath).mtime.getTime() > latestModTime) {
      currentLogFile = file;
      latestModTime = fs.statSync(filePath).mtime.getTime();
    }
  }

  if (!currentLogFile) {
    currentLogFile = `${getTimeStr('-', '-')}.log`;
    fs.writeFileSync(`${logDir}/${currentLogFile}`, '');
  }
  return currentLogFile;
}

function base(bot: mineflayer.Bot, prefix: string, msg: string, type: string) {
  if (!bot.canLog) {
    bot._withLogTitle = false;
    return;
  }
  let logData: string = '';
  if (bot._withLogTitle) {
    const title = `${getTimeStr()} ${prefix? `[${prefix}][${type}] ` : `[${type}] `}`;
    logData = `${title}${msg}`;
  } else {
    logData = msg;
  }
  bot._withLogTitle = true;

  console.log('\r' + logData);
  bot.canSaveLog && saveLog(bot, logData);
}

const LOG_TO_FILE = CmdUtil.getValueByArgName(process.argv, 'log') === 'true';

export default async function inject(bot: mineflayer.Bot) {
  // TODO: 更优雅地方式
  await new Promise(resolve => bot.once('login', () => resolve(1)));
  
  bot.canLog = true;
  bot.canSaveLog = LOG_TO_FILE;
  bot.maxLogSize = 1024 * 1024 * 10; // 10MB
  bot.logDir = `./log/${bot.username}`;
  bot.logFile = getLatestLogFile(bot.logDir, '', bot.maxLogSize);
  bot._withLogTitle = true;
  bot.baseInfo = (prefix: string, msg: string) => base(bot, prefix, msg, 'INFO');
  bot.baseWarn = (prefix: string, msg: string) => base(bot, prefix, msg, 'WARN');
  bot.baseError = (prefix: string, msg: string) => base(bot, prefix, msg, 'ERROR');
  bot.withoutLogTitle = () => {
    bot._withLogTitle = false;
    return bot;
  }
  pluginReady(bot, 'logger');
}


declare module 'mineflayer' {
  interface Bot {
    canLog: boolean;
    canSaveLog: boolean;
    _withLogTitle: boolean;
    logDir: string;
    logFile: string;
    maxLogSize: number;
    withoutLogTitle(): Bot;
    baseInfo(prefix: string, msg: string): void;
    baseWarn(prefix: string, msg: string): void;
    baseError(prefix: string, msg: string): void;
  }
}
