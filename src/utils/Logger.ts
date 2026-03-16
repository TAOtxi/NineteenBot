import fs from 'fs';

export default class LogUtil {
  private name: string;
  private logDir = './log';
  private maxLogFileSize = 1024 * 1024 * 10; // 10MB
  private currentLogFile = '';
  private logToFile = process.env.LOG_TO_FILE?.trim() === 'true';
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

  private getTimeStr() {
    const date = new Date();
    const time = 
      `${date.getFullYear()}-${this.pad(date.getMonth() + 1)}-${this.pad(date.getDate())} ${this.pad(date.getHours())}:${this.pad(date.getMinutes())}:${this.pad(date.getSeconds())}`;
    return time;
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
    this.logToFile && this.saveLog(logData);
  }

  public info(data: string, ...args: any[]) {
    this.baseLog('INFO', `${data} ${args.join(' ')}`);
  }

  // TODO: 有时候连不上服务器抛出错误时，莫名其妙会抛出 TypeError: this.baseLog is not a function...
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
    }

    const latestLogFile = this.getLatestLogFile();
    fs.appendFileSync(latestLogFile, msg + '\n');
  }

  private getLatestLogFile() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir);
    }

    if (this.currentLogFile && fs.statSync(this.currentLogFile).size < this.maxLogFileSize) {
      return this.currentLogFile;
    }

    const files = fs.readdirSync(this.logDir)
        .filter((file) => file.endsWith('.log'))
        .map(file => `${this.logDir}/${file}`);

    files.sort((a, b) => {
      const timeA = fs.statSync(a).mtime.getTime();
      const timeB = fs.statSync(b).mtime.getTime();
      return timeB - timeA;
    });
    
    if (!files[0] || fs.statSync(files[0]).size > this.maxLogFileSize) {
      const newLogFile = `${this.logDir}/${this.getTimeStr()}.log`;
      fs.writeFileSync(newLogFile, '');
      this.currentLogFile = newLogFile;
    } else {
      this.currentLogFile = files[0];
    }
    return this.currentLogFile;
  }
}
