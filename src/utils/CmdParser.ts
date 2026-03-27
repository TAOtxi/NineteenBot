import Algorithm from './Algorithm.js';

export default class CmdParser {
  private rawCmd: string;
  private cmds: string[];
  private currentCmdIndex: number;
  private args: Record<string, string>;
  private parts: string[];

  constructor(cmd: string) {
    this.rawCmd = cmd;
    this.parts = CmdParser.dividePart(cmd);
    const argsMap = CmdParser.parseCmd(this.parts);
    this.cmds = argsMap.cmds;
    this.args = argsMap.args;
    this.currentCmdIndex = 0;
  }

  hasArg(arg: string | string[]) {
    if (Array.isArray(arg)) {
      return Algorithm.haveIntersection(Object.keys(this.args), arg);
    }
    return this.args[arg] !== undefined;
  }

  hasCmd(cmd: string | string[]) {
    if (Array.isArray(cmd)) {
      return Algorithm.haveIntersection(this.getCmds(), cmd);
    }
    return this.getCmds().includes(cmd);
  }

  getCmds() {
    return this.cmds.slice(this.currentCmdIndex);
  }
  
  getFirstCmd() {
    return this.cmds[this.currentCmdIndex];
  }

  getArgs() {
    return this.args;
  }
  
  getRawCmd() {
    return this.rawCmd;
  }

  getValue(arg: string | string[]): string | undefined {
    if (Array.isArray(arg)) {
      for (const argItem of arg) {
        if (this.args[argItem] !== undefined) {
          return this.args[argItem];
        }
      }
      return undefined;
    }
    return this.args[arg];
  }

  getPartLength() {
    return this.cmds.length - this.currentCmdIndex + Object.keys(this.args).length;
  }

  dive() {
    if (this.currentCmdIndex >= this.cmds.length) {
      throw new Error('Out of index');
    }
    this.currentCmdIndex++;
    return this;
  }

  float() {
    if (this.currentCmdIndex < 0) {
      throw new Error('Out of index');
    }
    this.currentCmdIndex--;
    return this;
  }

  hasAnyArg() {
    return Object.keys(this.args).length > 0;
  }

  isCmd(cmd: string | string[]) {
    if (Array.isArray(cmd)) {
      if (!this.cmds[this.currentCmdIndex]) return false;
      return cmd.includes(this.cmds[this.currentCmdIndex]!);
    }
    return this.cmds[this.currentCmdIndex] === cmd;
  }

  isEmptyCmd() {
    return (this.cmds.length - this.currentCmdIndex) === 0 && !this.hasAnyArg();
  }

  getPart(index: number) {
    return this.parts.at(index);
  }

  static dividePart(cmd: string) {
    if (!cmd) return [];
    // 处理参数值中可能存在的空格，比如 "Golden Apple"
    const whiteSpace = '/<white_space>/';
    const match = cmd.match(/".*?"|'.*?'/g);
    if (match) {
      for (const item of match) {
        const value = item.replace(' ', whiteSpace);
        cmd = cmd.replace(item, value);
      } 
    }
    
    return cmd.split(' ').filter(arg => arg !== '').map(item => item.replace(whiteSpace, ' '));
  }

  /**
   * @description 解析命令行参数，暂时是这样吧
   * input  -->  info entity -c 50 --type player --ascend --name TAOtxi -d=50
   * output -->  {
   *   cmd: ['info', 'entity'],
   *   args: {
   *     '--type': 'player',
   *     '--ascend': '',
   *     '-c': '50',
   *     '--name': 'TAOtxi',
   *     '-d': '50',
   *   }
   * }
   * 
   * @param cmd
   * @returns 
   */
  static parseCmd(cmdParts: string[]) {
    const argsMap: { cmds: string[], args: Record<string, string> } = { cmds: [], args: {} };

    for (let i=0; i<cmdParts.length; i++) {
      const arg = cmdParts[i];
      if (!arg) continue;

      // 数字不能作为参数名，比如 `info -9 aaa`，-9会被认为是子命令
      // -9a 也会被认为是子命令
      if (!arg.startsWith('-') || arg.match(/^-\d+/)) {
          argsMap.cmds.push(arg);
          continue;
      };

      if (arg.includes('=')) {
        const arg_val = arg.split('=');
        if (!arg_val[0] || !arg_val[1]) {
          console.warn(`Skip invalid arg: ${arg}`);
          continue;
        }
        argsMap.args[arg_val[0]] = arg_val[1];
        continue;
      }

      let nextArg = cmdParts[i+1];
      if (!nextArg || (nextArg.startsWith('-') && !nextArg.match(/^-\d+/))) {
          argsMap.args[arg] = '';
          continue;
      }
      if (/^(?:".*?"|'.*?')$/.test(nextArg)) {
        nextArg = nextArg.slice(1, -1);
      }
      argsMap.args[arg] = nextArg;
      i++;
    }
    return argsMap;
  }

  static getValueByArgName(args: string[], argName: string, split: string ='=') {
    for (const arg of args) {
      if (!arg.includes(split)) continue;
      const arg_val = arg.split(split).map(val => val.trim());
      if (arg_val[0] === argName) {
        return arg_val[1];
      }
    }
    return null;
  }
}