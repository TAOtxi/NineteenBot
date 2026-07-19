import mineflayer from 'mineflayer';
import { pluginReady, waitPluginLoads } from '../utils/pluginWaiter.js';


const botTaskCache: Record<string, string[]> = {};
const botTaskMap: Record<string, (bot: mineflayer.Bot) => void> = {};

export function registerTask(task: string, callback: (bot: mineflayer.Bot) => void) {
  botTaskMap[task] = callback;
}

export function getTaskList() {
  return Object.keys(botTaskMap);
}

function addTask(bot: mineflayer.Bot, task: string, apply?: boolean) {
  if (!botTaskMap[task]) {
    bot.baseError(pluginName, `Task ${task} not found`);
    return;
  }

  if (bot.hasTask(task)) {
    bot.baseInfo(pluginName, `Task ${task} is already added`);
    return;
  }

  if (!botTaskCache[bot.identifier]) {
    botTaskCache[bot.identifier] = [];
  }
  botTaskCache[bot.identifier]!.push(task);

  if (apply) {
    botTaskMap[task]?.(bot);
  }
}

function applyTask(bot: mineflayer.Bot, task: string, add?: boolean) {
  if (!botTaskMap[task]) {
    bot.baseError(pluginName, `Task ${task} not found`);
    return;
  }
  botTaskMap[task]?.(bot);
  if (add && !bot.hasTask(task)) {
    if (!botTaskCache[bot.identifier]) {
      botTaskCache[bot.identifier] = [];
    }
    botTaskCache[bot.identifier]!.push(task);
  }
}

function removeTask(bot: mineflayer.Bot, task: string) {
  if (!botTaskCache[bot.identifier]) {
    return;
  }
  botTaskCache[bot.identifier] = botTaskCache[bot.identifier]!.filter(t => t !== task);
}

function hasTask(bot: mineflayer.Bot, task: string) {
  return botTaskCache[bot.identifier]?.includes(task) ?? false;
}

function removeAllTasks(bot: mineflayer.Bot) {
  delete botTaskCache[bot.identifier];
}

function registerCmd(bot: mineflayer.Bot) {
  const CM = bot.getCommandManager();
  bot.registerCmd(CM.command('task')
    .then(CM.command('list')
      .execute(bot => {
        bot.baseInfo('task', `Task List: (Current Tick: ${bot.ticker})`);
        for (const task of bot.timeTaskList) {
          bot.withoutLogTitle().baseInfo('task', `[${task.id}]:\tNext Run Tick: ${task.nextRunTick}.\tInterval: ${task.intervalGetter}.`);
        }
        bot.withoutLogTitle().baseInfo('task', '');
      }))
    .then(CM.command('apply')
      .then(CM.value('<task>')
        .suggests(() => Object.keys(botTaskMap))
        .execute((bot, task) => {
          applyTask(bot, task);
          bot.baseInfo(pluginName, `Apply Task: ${task}`);
        })))
    .then(CM.command('add')
      .then(CM.value('<task>')
        .suggests(() => Object.keys(botTaskMap))
        .execute((bot, task) => {
          addTask(bot, task);
          bot.baseInfo(pluginName, `Add Task: ${task}`);
        })))
    .then(CM.command('do')
      .then(CM.value('<task>')
        .suggests(() => Object.keys(botTaskMap))
        .execute((bot, task) => {
          addTask(bot, task, true);
          bot.baseInfo(pluginName, `Do Task: ${task}`);
        })))
    .then(CM.command('remove')
      .then(CM.value('<task>')
        .suggests(() => Object.keys(botTaskMap))
        .execute((bot, task) => {
          removeTask(bot, task);
          bot.baseInfo(pluginName, `Remove Task: ${task}`);
        })))
  );
}

const pluginName = 'initTask';
export default async function inject(bot: mineflayer.Bot) {
  await waitPluginLoads(bot, ['logger', 'command']);

  bot.addTask = (task: string, apply?: boolean) => addTask(bot, task, apply);
  bot.applyTask = (task: string, add?: boolean) => applyTask(bot, task, add);
  bot.removeTask = (task: string) => removeTask(bot, task);
  bot.hasTask = (task: string) => hasTask(bot, task);
  bot.removeAllTasks = () => removeAllTasks(bot);
  registerCmd(bot);

  for (const task of botTaskCache[bot.identifier] || []) {
    bot.applyTask(task);
  }

  pluginReady(bot, pluginName);
}



declare module 'mineflayer' {
  interface Bot {
    addTask(task: string, apply?: boolean): void;
    applyTask(task: string, add?: boolean): void;
    hasTask(task: string): boolean;
    removeTask(task: string): void;
    removeAllTasks(): void;
  }
}