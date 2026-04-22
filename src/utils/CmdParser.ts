import Algorithm from './Algorithm.js';

export default class CmdParser {
  private rawCmd: string;
  private cmds: string[];
  private currentCmdIndex: number;
  private args: Record<string, string>;
  private parts: string[];

  constructor(cmd: string) {
    this.rawCmd = cmd;
    const parseResult = CmdParser.parseCmd(cmd);
    this.cmds = parseResult.cmds;
    this.args = parseResult.args;
    this.parts = parseResult.parts;
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

  getCmd(index: number) {
    if (index < 0) {
      return this.cmds.at(index);
    }
    return this.cmds.at(index + this.currentCmdIndex);
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

  static isArgName(argName: string) {
    return argName.startsWith('-') && !argName.match(/^-\d+(?:\.\d+)?$/);
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
    if (index < 0) {
      return this.parts.at(index);
    }
    return this.parts.at(index + this.currentCmdIndex);
  }

  getPartLength() {
    return this.parts.length - this.currentCmdIndex + 1;
  }

  getPartList() {
    return this.parts.slice(this.currentCmdIndex);
  }

  static splitCmd(cmd: string) {
    if (!cmd) return [];
    // 处理参数值中可能存在的空格，比如 "Golden Apple"
    const whiteSpace = '/<white_space>/';
    const match = cmd.match(/".*?"|'.*?'/g);
    if (match) {
      for (const item of match) {
        const value = item.replace(' ', whiteSpace).slice(1, -1);
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
  static parseCmd(cmd: string) {
    const cmdParts = CmdParser.splitCmd(cmd);
    const parseResult: { cmds: string[], args: Record<string, string>, parts: string[] } = { cmds: [], args: {}, parts: [] };

    for (let i=0; i<cmdParts.length; i++) {
      const arg = cmdParts[i];
      if (!arg) continue;
      parseResult.parts.push(arg);

      // 数字不能作为参数名，比如 `info -9 aaa`，`-9`会被认为是子命令
      if (!CmdParser.isArgName(arg)) {
          parseResult.cmds.push(arg);
          continue;
      };

      if (arg.includes('=')) {
        const arg_val = arg.split('=');
        if (!arg_val[0] || !arg_val[1]) {
          console.warn(`Skip invalid arg: ${arg}`);
          continue;
        }
        parseResult.parts[parseResult.parts.length-1] = arg_val[0];
        parseResult.args[arg_val[0]] = arg_val[1];
        continue;
      }

      let nextArg = cmdParts[i+1];
      if (!nextArg || (nextArg.startsWith('-') && !nextArg.match(/^-\d+(?:\.\d+)?$/))) {
          parseResult.args[arg] = '';
          continue;
      }
      parseResult.args[arg] = nextArg;
      i++;
    }
    return parseResult;
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

  toString() {
    return {
      cmds: this.cmds,
      args: this.args,
      parts: this.parts,
    }
  }
}