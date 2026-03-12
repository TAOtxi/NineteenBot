import fs from 'fs';

export default class LogUtil {
  private name: string;
  private logDir = './log';
  private maxLogFileSize = 1024 * 1024 * 10; // 10MB
  private currentLogFile = '';
  private logToFile = true;

  constructor(prefix: string, logToFile: boolean = true) {
    this.name = prefix;
    this.logToFile = logToFile;
  }

  static getLogger(prefix: string, logToFile: boolean = true) {
    return new LogUtil(prefix, logToFile);
  }

  public setLogToFile(logToFile?: boolean) {
    this.logToFile = logToFile ?? true;
  }

  private prefix() {
    return `[${new Date().toLocaleString()}][${this.name}]`;
  }

  private baseLog(type: string, msg: string) {
    const logMsg = `${this.prefix()}[${type}] ${msg}`;
    console.log(logMsg);
    this.logToFile && this.saveLog(logMsg);
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
      const newLogFile = `${this.logDir}/${new Date().toLocaleString().replace(/[:/]/g, '-')}.log`;
      fs.writeFileSync(newLogFile, '');
      this.currentLogFile = newLogFile;
    } else {
      this.currentLogFile = files[0];
    }
    return this.currentLogFile;
  }
}
