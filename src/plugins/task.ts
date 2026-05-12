import mineflayer from 'mineflayer';
import { pluginReady } from '../utils/pluginWaiter.js';


function throttle(bot: mineflayer.Bot, id: string, interval: number, task: RunableTask) {
  if (bot._throttleVar[id] === undefined ||
      bot._throttleVar[id].lastRunTick + interval <= bot.ticker
  ) {
    bot._throttleVar[id] = {
      interval,
      lastRunTick: bot.ticker,
    }
    task(bot);
  }
  tryClearThrottle(bot);
}

function tryClearThrottle(bot: mineflayer.Bot) {
  const ids = Object.keys(bot._throttleVar);
  if (ids.length <= 40 && Math.random() > 0.1) {
    return;
  }

  for (const id of ids) {
    if (bot._throttleVar[id]!.lastRunTick + bot._throttleVar[id]!.interval <= bot.ticker) {
      delete bot._throttleVar[id];
    }
  }
}

function createTimeTask(
  bot: mineflayer.Bot, 
  id: string, 
  interval: number, 
  task: RunableTask, 
  runImmediately = false
) {
  if (bot.timeTaskList.some(task => task.id === id)) {
    throw new Error(`Task ${id} already exists`);
  }
  if (interval < 0) {
    throw new Error(`Interval ${interval} is not valid`);
  }
  bot.timeTaskList.push({
    id,
    task,
    interval: interval,
    nextRunTick: bot.ticker + interval,
  })
  runImmediately && task(bot);
}

function createOnceTimeTask(
  bot: mineflayer.Bot,
  id: string,
  runAfterTick: number,
  task: RunableTask
) {
  const onceTask = (bot: mineflayer.Bot) => {
    task(bot);
    bot.removeTimeTask(id);
  }
  createTimeTask(bot, id, runAfterTick, onceTask, false);
}

function removeTimeTask(bot: mineflayer.Bot, id: string) {
  for (let i = 0; i < bot.timeTaskList.length; i++) {
    if (bot.timeTaskList[i]!.id === id) {
      bot.timeTaskList.splice(i, 1);
      return;
    }
  }
}

function updateTimeTask(
  bot: mineflayer.Bot,
  id: string,
  interval: number,
  task?: RunableTask
) {
  const taskData = bot.timeTaskList.find(t => t.id === id);
  if (taskData === undefined) {
    throw new Error(`Task ${id} not found`);
  }
  taskData.task = task || taskData.task;
  taskData.interval = interval;
}

function createTickTask(
  bot: mineflayer.Bot,
  id: string,
  interval: number,
  task: RunableTask
) {
  if (bot.tickTaskList[id] !== undefined) {
    throw new Error(`Task ${id} already exists`);
  }
  bot.tickTaskList[id] = {
    ticker: 0,
    interval,
    task,
  }
}

function tickTask(bot: mineflayer.Bot, id: string) {
  const task = bot.tickTaskList[id];
  if (task === undefined) {
    throw new Error(`Task ${id} not found`);
  }
  task.ticker++;
  if (task.ticker >= task.interval) {
    task.task(bot);
    task.ticker = 0;
  }
}

function updateTickTask(
  bot: mineflayer.Bot, 
  id: string,
  interval: number,
  task?: RunableTask,
) {
  const taskData = bot.tickTaskList[id];
  if (taskData === undefined) {
    throw new Error(`Task ${id} not found`);
  }
  taskData.interval = interval;
  taskData.task = task || taskData.task;
}

function removeTickTask(bot: mineflayer.Bot, id: string) {
  if (bot.tickTaskList[id] !== undefined) {
    delete bot.tickTaskList[id];
  }
}

function hasTimeTask(bot: mineflayer.Bot, id: string) {
  return bot.timeTaskList.some(task => task.id === id);
}

function hasTickTask(bot: mineflayer.Bot, id: string) {
  return bot.tickTaskList[id] !== undefined;
}

const pluginName = 'task';
export default function inject(bot: mineflayer.Bot) {
  bot.ticker = 0;
  bot._throttleVar = {};
  bot.timeTaskList = [];
  bot.tickTaskList = {};
  bot.throttle = (id, interval, task) => throttle(bot, id, interval, task);
  bot.updateTimeTask = (id, interval, task) => updateTimeTask(bot, id, interval, task);
  bot.removeTimeTask = (id) => removeTimeTask(bot, id);
  bot.createOnceTimeTask = (id, runAfterTick, task) => createOnceTimeTask(bot, id, runAfterTick, task);
  bot.createTimeTask = (id, interval, task, runImmediately) => createTimeTask(bot, id, interval, task, runImmediately);
  bot.tickTask = (id) => tickTask(bot, id);
  bot.createTickTask = (id, interval, task) => createTickTask(bot, id, interval, task);
  bot.updateTickTask = (id, interval, task) => updateTickTask(bot, id, interval, task);
  bot.removeTickTask = (id) => removeTickTask(bot, id);
  bot.hasTimeTask = (id) => hasTimeTask(bot, id);
  bot.hasTickTask = (id) => hasTickTask(bot, id);


  bot.on('physicsTick', () => {
    bot.ticker++;
    for (let i=bot.timeTaskList.length-1; i>=0; i--) {
      const task = bot.timeTaskList[i];
      if (task === undefined) {
        continue;
      }

      if (bot.ticker >= task.nextRunTick) {
        task.task(bot);
        task.nextRunTick = bot.ticker + task.interval;
      }
    }
  })
  pluginReady(bot, pluginName);
}

interface TickTask {
  ticker: number,
  interval: number,
  task: RunableTask,
}

interface TimeTask {
  id: string,
  task: RunableTask,
  interval: number,
  nextRunTick: number,
}

interface ThrottleTaskInfo {
  interval: number,
  lastRunTick: number,
}

type RunableTask = (bot: mineflayer.Bot) => void;

declare module 'mineflayer' {
  interface Bot {
    ticker: number;
    timeTaskList: TimeTask[];
    tickTaskList: Record<string, TickTask>;
    _throttleVar: Record<string, ThrottleTaskInfo>;
    createOnceTimeTask(id: string, runAfterTick: number, task: RunableTask): void;
    createTimeTask(id: string, interval: number, task: RunableTask, runImmediately?: boolean): void;
    updateTimeTask(id: string, interval: number, task?: RunableTask): void;
    removeTimeTask(id: string): void;
    throttle(id: string, interval: number, task: RunableTask): void;
    createTickTask(id: string, interval: number, task: RunableTask): void;
    tickTask(id: string): void;
    updateTickTask(id: string, interval: number, task?: RunableTask): void;
    removeTickTask(id: string): void;
    hasTimeTask(id: string): boolean;
    hasTickTask(id: string): boolean;
  }
}
