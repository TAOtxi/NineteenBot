import fs from 'fs';
import mineflayer from 'mineflayer';
import { pluginReady } from '../utils/pluginWaiter.js';


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
  bot._logCache.push(msg);
  bot._logTimer && clearTimeout(bot._logTimer);
  if (bot._logCache.length >= 10) {
    flushLog(bot);
    return;
  }
  bot._logTimer = setTimeout(() => flushLog(bot), 100);
}

function flushLog(bot: mineflayer.Bot) {
  _saveLog(bot, bot._logCache.join('\n'));
  bot._logCache = [];
  bot._logTimer = null;
}

function _saveLog(bot: mineflayer.Bot, msg: string) {
  msg = msg.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');

  const latestLogFile = getLatestLogFile(bot.logDir, bot.logFile, bot.maxLogSize);
  const date = parseTimeStr(latestLogFile.replace('.log', ''));
  const currentDate = new Date();
  if (date.day !== currentDate.getDate() ||
    date.month !== currentDate.getMonth() + 1 ||
    date.year !== currentDate.getFullYear()) {
    bot.logFile = `${getTimeStr('-', '-')}.log`;
    fs.writeFile(`${bot.logDir}/${bot.logFile}`, msg + '\n', (err) => {
      err && console.error('Write log error:' + err + `[${bot.logDir}/${bot.logFile}]`);
    });
    return;
  }
  
  fs.appendFile(`${bot.logDir}/${bot.logFile}`, msg + '\n', (err) => {
    err && console.error('Write log error:' + err + `[${bot.logDir}/${bot.logFile}]`);
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

function timestamp() {
  return new Date().toTimeString().slice(0, 8);
}

function makeArrayStr(...arr: string[]) {
  return `[${arr.join('][')}] `;  // end with space
}

function baseLog(
  bot: mineflayer.Bot, 
  msg: string| number, 
  option: { title: string, type: string } = { type: 'INFO', title: '' }) {
  
  const title = option.title ? makeArrayStr(timestamp(), option.type, option.title) : '';
  const data = `${title}${msg}`;
  
  if (bot.canLog) {
    console.log(data, false);
  }
  saveLog(bot, data);
}

function chatLog(bot: mineflayer.Bot, msg: string | number) {
  const data = `${makeArrayStr(timestamp())}${msg}`;
  if (bot.canLog) {
    console.chat(data);
  }
  saveLog(bot, data);
}

export default async function inject(bot: mineflayer.Bot) {
  bot.canLog = false;
  bot.maxLogSize = 1024 * 1024 * 10; // 10MB
  bot.logDir = `./log/${bot.username}`;
  bot._logCache = [];
  bot._logTimer = null;
  bot.logFile = getLatestLogFile(bot.logDir, '', bot.maxLogSize);
  bot.chatLog = (msg) => chatLog(bot, msg);
  bot.on('display', () => bot.canLog = true);
  bot.on('hidden', () => bot.canLog = false);

  const makeLevelLog = (level: string) =>
    (titleOrMessage: string | number, msg?: string | number) => {
      if (msg === undefined) {
        baseLog(bot, titleOrMessage, { type: level, title: '' });
      } else {
        baseLog(bot, msg, { type: level, title: titleOrMessage.toString() });
      }
    };

  bot.baseInfo = makeLevelLog('INFO');
  bot.baseWarn = makeLevelLog('WARN');
  bot.baseError = makeLevelLog('ERROR');

  pluginReady(bot, 'logger');
}


declare module 'mineflayer' {
  interface Bot {
    canLog: boolean;
    logDir: string;
    logFile: string;
    maxLogSize: number;
    _logCache: string[];
    _logTimer: NodeJS.Timeout | null;
    chatLog(msg: string | number): void;
    baseInfo(msg: string | number): void;
    baseInfo(title: string, msg: string | number): void;
    baseWarn(msg: string | number): void;
    baseWarn(title: string, msg: string | number): void;
    baseError(msg: string | number): void;
    baseError(title: string, msg: string | number): void;
  }
}