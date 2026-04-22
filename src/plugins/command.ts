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

interface CommandData {
  level: number;
  name: string[];
  type: 'cmd' | 'arg';
  subCmds: CommandData[] | null;
  callback: ((bot: mineflayer.Bot, args?: Record<string, string>) => void) | null;
}

class CommandManager implements CommandData {
  level: number;
  name: string[];
  type: 'cmd' | 'arg';
  subCmds: CommandData[] | null;
  callback: ((bot: mineflayer.Bot, args?: Record<string, string>) => void) | null;

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
    if (this.type === 'arg') {
      console.warn('Argument command cannot have sub-commands.');
      return this;
    }
    if (!this.subCmds) {
      this.subCmds = [];
    }
    this.subCmds.push(cmd.toData());
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

function tryExecute(bot: mineflayer.Bot, input: string) {
  const parseCmd = new CmdParser(input);
  const callbacks: typeof CommandManager.prototype.callback[] = [];

  const cmdLen = parseCmd.getCmds().length;
  let currentCmdMap = bot._cmdMap;
  let lastPartHasCallback = false;

  for (let i = 0; i < cmdLen; i++) {
    if (currentCmdMap.length === 0) {
      break;
    }

    let hasCommand = false;
    for (const cmdMap of currentCmdMap) {
      if (parseCmd.isCmd(cmdMap.name)) {
        if (i === cmdLen - 1) {
          lastPartHasCallback = lastPartHasCallback || cmdMap.callback !== null;
        }
        currentCmdMap = cmdMap.subCmds || [];
        callbacks.push(cmdMap.callback);
        parseCmd.dive();
        hasCommand = true;
        break;
      }
    }
    if (!hasCommand) {
      break;
    }
  }
  if (callbacks.length !== cmdLen) {
    return;
  }

  const registerArgs = currentCmdMap.map(item => item.name).flat();

  for (let i=0; i<callbacks.length; i++) {
    if (i === callbacks.length - 1 && parseCmd.hasAnyArg()) {
      const argMaps: Record<string, string> = {};
      for (const key of registerArgs) {
        if (!parseCmd.hasArg(key)) {
          continue;
        }
        argMaps[key] = parseCmd.getValue(key)!;
      }
      callbacks[i]?.(bot, argMaps);
    } else {
      callbacks[i]?.(bot);
    }
  }

  if (registerArgs.length === 0) {
    return;
  }

  for (const argItem of currentCmdMap) {
    if (!argItem.callback || argItem.type !== 'arg') continue;
    const argMap: Record<string, string> = {};
    for (const key of argItem.name) {
      if (!parseCmd.hasArg(key)) {
        continue;
      }
      argMap[key] = parseCmd.getValue(key)!;
    }
    Object.keys(argMap).length > 0 && argItem.callback(bot, argMap);
  }
}

function setLevel(data: CommandData, currentLevel: number) {
  data.level = currentLevel;
  data.subCmds?.forEach(cmd => setLevel(cmd, currentLevel + 1));
}


export default function inject(bot: mineflayer.Bot) {
  bot._cmdMap = [];
  bot.registerCmd = (cmdManager: CommandManager) => {
    const data = cmdManager.toData();
    setLevel(data, 1);
    bot._cmdMap.push(data);
  };
  bot.tryExecute = (input: string) => {
    tryExecute(bot, input);
  };
  bot.getCommandManager = () => CommandManager;

  bot.emit('pluginLoaded_command');
  bot.isCommandPluginLoaded = true;
}

export {
  CommandManager
};
export type { CommandData };


declare module 'mineflayer' {
  interface Bot {
    _cmdMap: CommandData[];
    isCommandPluginLoaded: boolean;
    registerCmd(cmdManager: CommandManager): void;
    tryExecute(input: string): void;
    getCommandManager(): typeof CommandManager;
  }

  interface BotEvents {
    pluginLoaded_command(): void;
  }
}