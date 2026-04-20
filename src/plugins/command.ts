import mineflayer from "mineflayer";

interface CommandData {
  level: number;
  name: string[];
  type: 'cmd' | 'arg';
  subCmds: CommandData[] | null;
  callback: ((bot: mineflayer.Bot, args?: { [key: string]: string }) => void) | null;
}

class CommandManager implements CommandData {
  level: number;
  name: string[];
  type: 'cmd' | 'arg';
  subCmds: CommandData[] | null;
  callback: ((bot: mineflayer.Bot, args?: { [key: string]: string }) => void) | null;

  constructor(name: string | string[], type: 'cmd' | 'arg') {
    this.level = -1;
    this.name = typeof name === 'string' ? [name] : name;
    this.type = type;
    this.subCmds = null;
    this.callback = null;
  }

  static argument(args: string | string[], limit?: any) {
    return new CommandManager(args, 'arg');
  }

  static command(name: string | string[], limit?: any) {
    return new CommandManager(name, 'cmd');
  }

  execute(callback: (bot: mineflayer.Bot, args?: { [key: string]: string }) => void) {
    this.callback = callback;
    return this;
  }

  then(cmd: CommandManager) {
    if (!this.subCmds) {
      this.subCmds = [];
    }
    this.subCmds.push(cmd.toData());
    if (cmd.type === 'arg' && 
        this.callback === undefined &&
        cmd.callback !== undefined) {
      this.callback = cmd.callback;
    }
    return this;
  }

  toString() {
    return `CommandManager { level: ${this.level}, name: ${this.name}, type: ${this.type}, subCmds: ${this.subCmds} }`;
  }

  toData(): CommandData {
    return {
      level: this.level,
      name: this.name,
      type: this.type,
      subCmds: this.subCmds,
      callback: this.callback,
    }
  }

  view() {
    console.log(JSON.stringify({
      level: this.level,
      name: this.name,
      type: this.type,
      subCmds: this.subCmds,
      callback: this.callback,
    }, null, 2));
  }
}

function setLevel(data: CommandData, currentLevel: number) {
  data.level = currentLevel;
  if (data.subCmds) {
    data.subCmds.forEach(cmd => setLevel(cmd, currentLevel + 1));
  }
}

function registerCmd(bot: mineflayer.Bot, cmdManager: CommandManager) {
  const data = cmdManager.toData();
  setLevel(data, 1);
  bot._cmdMap.push(data);
}

export default function inject(bot: mineflayer.Bot) {
  bot._cmdMap = [];
  bot.registerCmd = (cmdManager: CommandManager) => registerCmd(bot, cmdManager);
}

export {
  CommandManager,
}


declare module 'mineflayer' {
  interface Bot {
    _cmdMap: CommandData[];
    registerCmd: (cmdManager: CommandManager) => void;
  }
}