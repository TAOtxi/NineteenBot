import mineflayer from 'mineflayer';
import { pluginReady, waitPluginLoads } from '../utils/pluginWaiter.js';

const defaultConfig = {
  tasks: [] as MenuClickTask[],
};



function registerCmd(bot: mineflayer.Bot) {
  const CommandManager = bot.getCommandManager();
  bot.registerCmd(CommandManager.command('clicker')
    .then(CommandManager.command('run')
      .then(CommandManager.value('<task>')
        .suggests(() => getTaskList(bot).map(t => t.name))
        .execute(runClickTask))
    )
  );
}

function runClickTask(bot: mineflayer.Bot, taskName: string) {
  const tasks = getTaskList(bot);
  const task = tasks.find(t => t.name === taskName);
  if (!task) {
    bot.baseError(pluginName, `task ${taskName} not found`);
    return;
  }
  if (task.actions.length === 0) {
    bot.baseError(pluginName, `task ${taskName} has no actions`);
    return;
  }
  if (bot.hasTimeTask(`${pluginName}_${taskName}`)) {
    bot.baseError(pluginName, `task ${taskName} is running`);
    return;
  }

  const actions = task.actions.map(parseActionStr);
  bot._menuClickRunIndexMap[taskName] = 0;

  bot.createOnceTimeTask(`${pluginName}_start_${taskName}`, () => {
    bot.createTimeTask(`${pluginName}_${taskName}`, () => {
      let index = bot._menuClickRunIndexMap[taskName];
      if (index === undefined) {
        throw new Error('index is undefined');
      }

      if (index >= actions.length) {
        if (task.isLoop) {
          bot._menuClickRunIndexMap[taskName] = 0;
          index = 0;
        } else {
          if (bot.currentWindow?.type === 5) {
            bot.closeWindow(bot.currentWindow);
          }
          stopClickTask(bot, taskName);
          return;
        }
      }
      const action = actions[index];
      if (!action) {
        throw new Error('action is undefined');
      }
      if (action.isClick()) {
        if (action.clickType === -1) {
          throw new Error(`clickType ${action.clickType} is invalid`);
        }
        
        const type = bot.currentWindow?.type;
        if (type !== "minecraft:generic_9x6" && type !== "minecraft:generic_9x3") {
          bot.baseError(pluginName, `window ${type} is not chest`);
          stopClickTask(bot, taskName);
          return;
        }
        bot.clickWindow(action.slot, action.button, action.clickType);
      } else if (action.isCommand()) {
        bot.chat(action.command!);
      } else {
        throw new Error(`action ${action} is invalid`);
      }
      bot._menuClickRunIndexMap[taskName] = index + 1;
    }, task.delay);
  }, task.startDelay);
}

function stopClickTask(bot: mineflayer.Bot, taskName: string) {
  const tasks = getTaskList(bot);
  const task = tasks.find(t => t.name === taskName);
  if (!task) {
    bot.baseError(pluginName, `task ${taskName} not found`);
    return;
  }
  if (bot._menuClickRunIndexMap[taskName] === undefined) {
    bot.baseError(pluginName, `task ${taskName} is not running`);
    return;
  }

  bot.removeTimeTask(`${pluginName}_${taskName}`);
  delete bot._menuClickRunIndexMap[taskName];
  bot.baseInfo(pluginName, `task ${taskName} stopped`);
}

function getTaskList(bot: mineflayer.Bot): MenuClickTask[] {
  return bot.getConfig(pluginName, 'tasks');
}

function parseActionStr(actionStr: string): TaskAction {
  if (!actionStr) {
    throw new Error('actionStr is empty');
  }
  if (actionStr.startsWith('/')) {
    return new TaskAction(actionStr);
  }

  const matcher = actionStr.match(CLICK_TYPE_PATTERN);
  if (!matcher || matcher.length !== 4) {
    throw new Error(`action ${actionStr} is invalid`);
  }
  const clickTypeStr = matcher[1]!;
  const button = parseInt(matcher[2]!);
  const slot = parseInt(matcher[3]!);

  return new TaskAction(clickTypeStr, button, slot);
}

const pluginName = 'menuClick';


export default async function inject(bot: mineflayer.Bot) {
  await waitPluginLoads(bot, ['logger', 'task', 'command', 'makeConfig']);
  bot.loadConfig(pluginName, defaultConfig);
  bot._menuClickRunIndexMap = {};

  bot.runClickTask = (taskName: string) => runClickTask(bot, taskName);
  bot.stopClickTask = (taskName: string) => stopClickTask(bot, taskName);

  registerCmd(bot);

  pluginReady(bot, pluginName);
}


const CLICK_TYPE_PATTERN = /(\w+) (\d+) (\d+)/;

interface MenuClickTask {
  description: string;
  name: string;
  isLoop: boolean;
  startDelay: number;
  delay: number;

  actions: string[];
}

class TaskAction {
  command: string | null = null;
  clickType: number = -1;
  button: number = -1;
  slot: number = -1;

  constructor(str: string, button: number = -1, slot: number = -1) {
    if (str.startsWith('/') && (button !== -1 || slot !== -1)) {
      this.command = str;
      return;
    };
    this.button = button;
    this.slot = slot;

    const str2 = str.replace('_', '').toLocaleUpperCase();
    const matchList = ['pickup', 'quickmove', 'swap', 'clone', 'throw', 'quickcraft', 'pickupall'];
    this.clickType = matchList.indexOf(str2);
  }

  isClick() {
    return this.clickType !== -1;
  }


  isCommand() {
    return this.command !== null && this.command.startsWith('/');
  }
}


declare module 'mineflayer' {
  interface Bot {
    _menuClickRunIndexMap: Record<string, number>;
    runClickTask(taskName: string): void;
    stopClickTask(taskName: string): void;
  }
}