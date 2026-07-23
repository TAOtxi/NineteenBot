import fs from 'fs';
import CmdUtil from '../utils/CmdParser.js';
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

function saveLog(msg: string, option: { logDir: string, logFile: string, maxLogSize: number }) {
  msg = msg.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');

  const latestLogFile = getLatestLogFile(option.logDir, option.logFile, option.maxLogSize);
  const date = parseTimeStr(latestLogFile.replace('.log', ''));
  const currentDate = new Date();
  if (date.day !== currentDate.getDate() ||
    date.month !== currentDate.getMonth() + 1 ||
    date.year !== currentDate.getFullYear()) {
    option.logFile = `${getTimeStr('-', '-')}.log`;
    fs.writeFile(`${option.logDir}/${option.logFile}`, msg + '\n', (err) => {
      err && console.error('Write log error:', err, `[${option.logDir}/${option.logFile}]`);
    });
    return;
  }
  
  fs.appendFile(`${option.logDir}/${option.logFile}`, msg + '\n', (err) => {
    err && console.error('Write log error:', err, `[${option.logDir}/${option.logFile}]`);
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
  
  const title = option.title ? makeArrayStr(timestamp(), option.title, option.type) : '';
  
  if (bot.canLog) {
    console.log(`${title}${msg}`);
  }
  saveLog(msg.toString(), { logDir: bot.logDir, logFile: bot.logFile, maxLogSize: bot.maxLogSize });
}

function chatLog(bot: mineflayer.Bot, msg: string | number) {
  const data = `${makeArrayStr(timestamp())}${msg}`;
  if (bot.canLog) {
    console.chat(data);
  }
  saveLog(data, { logDir: bot.logDir, logFile: bot.logFile, maxLogSize: bot.maxLogSize });
}

export default async function inject(bot: mineflayer.Bot) {
  bot.canLog = false;
  bot.maxLogSize = 1024 * 1024 * 10; // 10MB
  bot.logDir = `./log/${bot.username}`;
  bot.logFile = getLatestLogFile(bot.logDir, '', bot.maxLogSize);
  bot.chatLog = (msg) => chatLog(bot, msg);
  bot.on('hidden', () => bot.canLog = false);
  bot.on('display', () => bot.canLog = true);

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
    chatLog(msg: string | number): void;
    baseInfo(msg: string | number): void;
    baseInfo(title: string, msg: string | number): void;
    baseWarn(msg: string | number): void;
    baseWarn(title: string, msg: string | number): void;
    baseError(msg: string | number): void;
    baseError(title: string, msg: string | number): void;
  }
}
