` // JAVA 的命令注册方式
public static void registerCommand(CommandDispatcher<FabricClientCommandSource> dispatcher,
        CommandBuildContext registryAccess) {
    dispatcher.register(ClientCommandManager.literal(AutoAction.MODULE_NAME)
        .then(ClientCommandManager.literal("list").executes(Commander::listActions))
        .then(ClientCommandManager.literal("test").executes(Commander::test))
        .then(ClientCommandManager.literal("reset").executes(Commander::reset)
            .then(ClientCommandManager.argument("name", StringArgumentType.string())
                .executes(Commander::launchActions)))
        .then(ClientCommandManager.literal("save")
            .then(ClientCommandManager.argument("name", StringArgumentType.string())
                .executes(Commander::saveActions)))
        .then(ClientCommandManager.literal("cmd")
            .then(ClientCommandManager.argument("cmd", StringArgumentType.string())
                .then(ClientCommandManager.argument("delay", IntegerArgumentType.integer(1))
                    .executes(Commander::addCommand))))
        .then(ClientCommandManager.literal("click")
            .then(ClientCommandManager.argument("slot", IntegerArgumentType.integer(0, 53))
                .then(ClientCommandManager.argument("clickType", StringArgumentType.string())
                    .then(ClientCommandManager.argument("delay", IntegerArgumentType.integer(1))
                        .executes(Commander::addClick)))))
        .then(ClientCommandManager.literal("cut").executes(Commander::addCut))
        .then(ClientCommandManager.literal("loop").executes(Commander::addLoop))
    );
}
`

import mineflayer from "mineflayer";
import CmdParser from "../utils/CmdParser.js";
import { pluginReady } from "../utils/pluginWaiter.js";

export enum CommandType {
  CMD = 'cmd',
  ARG = 'arg',
  VALUE = 'value',
}


class CommandManager <T extends CommandType = CommandType.CMD> {
  level: number;
  name: T extends CommandType.VALUE ? string : string[];
  type: CommandType;
  subCmds: CommandManager[] | null;

  callback: ((
      bot: mineflayer.Bot, 
      args?: 
        T extends CommandType.CMD ? Record<string, string> :
        T extends (CommandType.ARG | CommandType.VALUE) ? string :
        never
      ) => void) | null;
  
  // constructor(name: string, type: CommandType.VALUE);
  // constructor(name: string | string[], type: Exclude<CommandType, CommandType.VALUE>);
  // constructor(name: string | string[], type: CommandType) {
  //   this.level = -1;
  //   if (type === CommandType.VALUE) {
  //     this.name = name as T extends CommandType.VALUE ? string : string[];
  //   } else {
  //     this.name = (typeof name === 'string' ? [name] : name) as T extends CommandType.VALUE ? string : string[];
  //   }
  //   this.type = type;
  //   this.subCmds = null;
  //   this.callback = null;
  // }

  constructor(name: T extends CommandType.VALUE ? string : (string | string[]), type: T) {
    this.level = -1;
    if (type === CommandType.VALUE) {
      this.name = name as T extends CommandType.VALUE ? string : string[];
    } else {
      this.name = (typeof name === 'string' ? [name] : name) as T extends CommandType.VALUE ? string : string[];
    }
    this.type = type;
    this.subCmds = null;
    this.callback = null;
  }

  static command(name: string | string[], limit?: any) {
    return new CommandManager<CommandType.CMD>(name, CommandType.CMD);
  }

  static argument(args: string | string[], limit?: any) {
    return new CommandManager<CommandType.ARG>(args, CommandType.ARG);
  }

  static value(name: string, limit?: any) {
    return new CommandManager<CommandType.VALUE>(name, CommandType.VALUE);
  }

  // TODO: value类型可以有多个
  execute(callback: (
      bot: mineflayer.Bot, 
      args?: 
        T extends CommandType.CMD ? Record<string, string> :
        T extends (CommandType.ARG | CommandType.VALUE) ? string :
        never
      ) => void) {
    this.callback = callback;
    return this;
  }

  then(cmd: CommandManager<CommandType>) {
    if (this.type === CommandType.ARG || this.type === CommandType.VALUE) {
      throw new Error('Cannot have sub-commands.');
    }

    if (!this.subCmds) {
      this.subCmds = [];
    } else if (cmd.type === CommandType.VALUE) {
      throw new Error('Cannot have sub-commands.');
    }

    if (this.subCmds.some(subCmd => subCmd.type === CommandType.VALUE)) {
      throw new Error('Cannot have sub-commands.');
    }

    this.subCmds.push(cmd);
    const typeSet = new Set(this.subCmds.map(cmd => cmd.type));
    
    if (typeSet.has(CommandType.ARG) && typeSet.size > 1) {
      throw new Error('Argument command with other command type !');
    }

    return this;
  }

  toString() {
    return `CommandManager { level: ${this.level}, name: ${this.name}, type: ${this.type}, subCmds: ${this.subCmds} }`;
  }

  toData() {
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


function tryExecute(bot: mineflayer.Bot, input: string) {
  const parseCmd = new CmdParser(input);

  const cmdLen = parseCmd.getCmds().length;
  let currentCmdMap = bot._cmdMap;
  let tailCallback: typeof CommandManager.prototype.callback | null = null;
  let execPartCount = 0;

  for (let i = 0; i < cmdLen; i++) {
    if (parseCmd.getFirstCmd() === null ||
        currentCmdMap === null ||
        currentCmdMap.length === 0
        ) {
      return false;
    }

    let hasCommand = false;
    for (const item of currentCmdMap) {
      if (item.type === CommandType.ARG) {
        return false;
      }
      if (item.type === CommandType.VALUE) {
        if (i !== cmdLen - 1) {
          return false;
        }
        item.callback?.(bot, parseCmd.getFirstCmd());
        return true;
      }

      if (!parseCmd.isCmd(item.name)) continue;
      console.log(item.name)

      tailCallback = item.callback;
      execPartCount++;
      hasCommand = true;
      currentCmdMap = item.subCmds || [];
      i !== cmdLen - 1 && parseCmd.dive();
      break;
    }

    if (!hasCommand) {
      return false;
    }
  }
  
  if (execPartCount !== cmdLen) {
    return false;
  }

  const argMap: Record<string, string> = {};
  for (const argItem of currentCmdMap) {
    const value = parseCmd.getValue(argItem.name);
    if (value === undefined) continue;

    for (const key of argItem.name) {
      if (!parseCmd.hasArg(key)) {
        continue;
      }
      argMap[key] = value;
    }
    argItem.callback?.(bot, value);
  }
  tailCallback?.(bot, argMap);
  return true;
}

function setLevel(manager: CommandManager, currentLevel: number) {
  manager.level = currentLevel;
  manager.subCmds?.forEach(cmd => setLevel(cmd, currentLevel + 1));
}


export default function inject(bot: mineflayer.Bot) {
  bot._cmdMap = [];
  bot.registerCmd = (cmdManager: CommandManager<CommandType>) => {
    if (cmdManager.type !== CommandType.CMD) {
      throw new Error('Only CMD type can be registered.');
    }

    setLevel(cmdManager, 1);
    bot._cmdMap.push(cmdManager);
  };
  bot.tryExecute = (input: string) => {
    tryExecute(bot, input);
  };
  bot.getCommandManager = () => CommandManager;

  pluginReady(bot, 'command');
}

export {
  CommandManager
};


declare module 'mineflayer' {
  interface Bot {
    _cmdMap: CommandManager<CommandType>[];
    registerCmd(cmdManager: CommandManager<CommandType>): void;
    tryExecute(input: string): void;
    getCommandManager(): typeof CommandManager;
  }
}