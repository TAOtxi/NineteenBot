import fs from 'fs';
import CmdUtil from './CmdParser.js';

let currentLogFile = '';
const LOG_DIR = './log';
const MAX_LOG_SIZE = 1024 * 1024 * 10; // 10MB
const LOG_TO_FILE = CmdUtil.getValueByArgName(process.argv, 'log') === 'true';
const logCache: string[] = [];
const LOG_CACHE_SIZE = 10;

process.on('exit', () => {
  LogUtil.writeLog(currentLogFile);
});

export default class LogUtil {
  private name: string;
  private hasPrefix = true;

  constructor(prefix: string) {
    this.name = prefix;
  }

  static getLogger(prefix: string) {
    return new LogUtil(prefix);
  }

  private pad(num: number, length: number = 2, char: string = '0') {
    return num.toString().padStart(length, char);
  }

  public withoutPrefix() {
    this.hasPrefix = false;
    return this;
  }

  private getTimeStr(dateSep: string = '-', timeSep: string = ':') {
    const date = new Date();
    const time = 
      `${date.getFullYear()}${dateSep}${this.pad(date.getMonth() + 1)}${dateSep}${this.pad(date.getDate())} ${this.pad(date.getHours())}${timeSep}${this.pad(date.getMinutes())}${timeSep}${this.pad(date.getSeconds())}`;
    return time;
  }

  private parseTimeStr(time: string) {
    const timeArr = time.replace(' ', '-').split('-');
    if (!timeArr[0] || !timeArr[1] || !timeArr[2]) {
      throw new Error('Invalid time format');
    }
    const year = parseInt(timeArr[0]);
    const month = parseInt(timeArr[1]);
    const day = parseInt(timeArr[2]);
    return { year, month, day };
  }

  private prefix() {
    const time = this.getTimeStr();
    return `[${time}][${this.name}]`;
  }

  private baseLog(type: string, msg: string) {
    const prefix = `${this.prefix()}[${type}] `;
    const logData = `${ this.hasPrefix ? prefix : ''}${msg}`;
    this.hasPrefix = true;
    console.log(logData);
    LOG_TO_FILE && this.saveLog(logData);
  }

  public info(data: string, ...args: any[]) {
    this.baseLog('INFO', `${data} ${args.join(' ')}`);
  }

  public error(data: string, ...args: any[]) {
    this.baseLog('ERROR', `${data} ${args.join(' ')}`);
  }

  public debug(data: string, ...args: any[]) {
    this.baseLog('DEBUG', `${data} ${args.join(' ')}`);
  }

  public warn(data: string, ...args: any[]) {
    this.baseLog('WARN', `${data} ${args.join(' ')}`);
  }

  public saveLog(msg?: string) {
    if (msg) {
      msg = msg.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
    } else {
      return;
    }

    const latestLogFile = this.getLatestLogFile();
    const date = this.parseTimeStr(latestLogFile.replace('.log', ''));
    const currentDate = new Date();
    if (date.day !== currentDate.getDate() ||
        date.month !== currentDate.getMonth() + 1 ||
        date.year !== currentDate.getFullYear()) {
      currentLogFile = `${this.getTimeStr('-', '-')}.log`;
      LogUtil.writeLog(currentLogFile);
    }
    logCache.push(msg);

    if (logCache.length >= LOG_CACHE_SIZE) {
      LogUtil.writeLog(currentLogFile);
    }
  }

  static writeLog(logFile: string) {
    if (!logCache.length) {
      return;
    }
    const logFilePath = `${LOG_DIR}/${logFile}`;
    if (!fs.existsSync(logFilePath)) {
      fs.writeFileSync(logFilePath, '');
    }
    const logData = logCache.join('\n') + '\n';
    logCache.length = 0;
    fs.appendFileSync(logFilePath, logData);
  }

  private getLatestLogFile() {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR);
    }
    if (currentLogFile) {
      if (!fs.existsSync(`${LOG_DIR}/${currentLogFile}`)) {
        fs.writeFileSync(`${LOG_DIR}/${currentLogFile}`, '');
      }

      if (fs.statSync(`${LOG_DIR}/${currentLogFile}`).size < MAX_LOG_SIZE) {
        return currentLogFile;
      }
    }

    const files = fs.readdirSync(LOG_DIR).filter((file) => file.endsWith('.log'));
    let latestModTime = 0;
    currentLogFile = '';
    for (const file of files) {
      const filePath = `${LOG_DIR}/${file}`;
      if (fs.statSync(filePath).mtime.getTime() > latestModTime) {
        currentLogFile = file;
        latestModTime = fs.statSync(filePath).mtime.getTime();
      }
    }

    if (!currentLogFile) {
      currentLogFile = `${this.getTimeStr('-', '-')}.log`;
    }
    
    return currentLogFile;
  }
}
