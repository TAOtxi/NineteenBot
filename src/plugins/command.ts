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


export default function inject(bot: mineflayer.Bot) {
  bot._cmdMap = [];
  bot.registerCmd = (cmdManager: CommandManager) => {
    const data = cmdManager.toData();
    setLevel(data, 1);
    bot._cmdMap.push(data);
  };
  bot.getCommandManager = () => CommandManager;
}

export {
  CommandManager
};
export type { CommandData };


declare module 'mineflayer' {
  interface Bot {
    _cmdMap: CommandData[];
    registerCmd(cmdManager: CommandManager): void;
    getCommandManager(): typeof CommandManager;
  }
}