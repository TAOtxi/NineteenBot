import fs from 'fs';

export default class LogUtil {
  private name: string;
  private cache: string[] = [];
  private maxCacheSize = 100;
  private logDir = './log';
  private maxLogFileSize = 1024 * 1024 * 10; // 10MB
  private currentLogFile = '';

  constructor(prefix: string) {
    this.name = prefix;
  }

  static getLogger(prefix: string) {
    return new LogUtil(prefix);
  }

  private prefix() {
    return `[${new Date().toLocaleTimeString()}][${this.name}]`;
  }

  public info(data: string, ...args: any[]) {
    const msg = `${this.prefix()}[INFO] ${data} ${args.join(' ')}`;
    console.log(msg);
    this.saveLog(msg);
  }

  public error(data: string, ...args: any[]) {
    const msg = `${this.prefix()}[ERROR] ${data} ${args.join(' ')}`;
    console.error(msg, ...args);
    this.saveLog(msg);
  }

  public debug(data: string, ...args: any[]) {
    const msg = `${this.prefix()}[DEBUG] ${data} ${args.join(' ')}`;
    console.debug(msg, ...args);
    this.saveLog(msg);
  }

  public warn(data: string, ...args: any[]) {
    const msg = `${this.prefix()}[WARN] ${data} ${args.join(' ')}`;
    console.warn(msg, ...args);
    this.saveLog(msg);
  }

  public saveLog(msg?: string, immediately?: boolean) {
    msg && this.cache.push(msg);

    if (this.cache.length < this.maxCacheSize && !immediately) {
      return;
    }
    if (!this.currentLogFile) {
      this.currentLogFile = new Date().toLocaleString()
        .replace(':', '-')
        .replace(' ', '-') + '.txt';
    }
    const logFilePath = `${this.logDir}/${this.currentLogFile}`;
    msg = this.cache.join('\n');
    fs.appendFileSync(logFilePath, msg + '\n');
    if (fs.statSync(logFilePath).size > this.maxLogFileSize) {
      this.currentLogFile = '';
    }
  }
}
