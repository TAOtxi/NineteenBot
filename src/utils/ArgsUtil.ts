import Algorithm from './Algorithm.js';

export default class CmdParser {
  private rawCmd: string;
  private cmds: string[];
  private args: Record<string, string>;

  constructor(cmd: string) {
    this.rawCmd = cmd;
    const argsMap = CmdParser.parseArgs(cmd);
    this.cmds = argsMap.cmds;
    this.args = argsMap.args;
  }

  hasArg(arg: string | string[]) {
    if (Array.isArray(arg)) {
      return Algorithm.haveIntersection(Object.keys(this.args), arg);
    }
    return this.args[arg] !== undefined;
  }

  hasCmd(cmd: string | string[]) {
    if (Array.isArray(cmd)) {
      return Algorithm.haveIntersection(this.cmds, cmd);
    }
    return this.cmds.includes(cmd);
  }

  getCmds() {
    return this.cmds;
  }
  
  getFirstCmd() {
    return this.cmds[0];
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
    this.cmds.shift();
    return this;
  }

  hasAnyArg() {
    return Object.keys(this.args).length > 0;
  }

  isCmd(cmd: string | string[]) {
    if (Array.isArray(cmd)) {
      if (!this.cmds[0]) return false;
      return cmd.includes(this.cmds[0]);
    }
    return this.cmds[0] === cmd;
  }

  /**
   * @description 解析命令行参数，暂时是这样吧
   * input  -->  info entity -c 50 --type player --ascend --name TAOtxi
   * output -->  {
   *   cmd: ['info', 'entity'],
   *   args: {
   *     '--type': 'player',
   *     '--ascend': '',
   *     '-c': '50',
   *     '--name': 'TAOtxi',
   *   }
   * }
   * 
   * @param cmd
   * @returns 
   */
  static parseArgs(cmd: string) {
    const argsMap: { cmds: string[], args: Record<string, string> } = { cmds: [], args: {} };

    // 处理参数值中可能存在的空格，比如 "Golden Apple"
    const whiteSpace = '/<white_space>/';
    const match = cmd.match(/["'].*?["']/g);
    if (match) {
      for (const item of match) {
        const value = item.replace(/["']/g, '').replace(' ', whiteSpace);
        cmd = cmd.replace(item, value);
      } 
    }
    
    // TODO: 无法正确处理形如 -r -90,0 的参数
    const argsList = cmd.split(' ').filter(arg => arg !== '');
    for (let i=0; i<argsList.length; i++) {
      const arg = argsList[i];
      if (!arg) continue;
      if ((!arg.startsWith('--') && !arg.startsWith('-')) || arg.match(/^-\d+$/)) {
          argsMap.cmds.push(arg);
          continue;
      };

      const nextArg = argsList[i+1];
      if (!nextArg || nextArg.startsWith('--') || nextArg.startsWith('-')) {
          argsMap.args[arg] = '';
          continue;
      }
      argsMap.args[arg] = nextArg.replace(whiteSpace, ' ');
      i++;
    }
    return argsMap;
  }
}