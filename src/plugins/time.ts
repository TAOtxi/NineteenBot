import mineflayer from 'mineflayer';
import { pluginReady } from '../utils/pluginWaiter.js';


function throttle(bot: mineflayer.Bot, id: string, task: () => void, interval: number) {
  if (bot._throttleVar[id] === undefined ||
      bot._throttleVar[id].lastRunTick + interval <= bot.ticker
  ) {
    bot._throttleVar[id] = {
      interval,
      lastRunTick: bot.ticker,
    }
    task();
  }
  tryClearThrottle(bot);
}

function tryClearThrottle(bot: mineflayer.Bot) {
  const ids = Object.keys(bot._throttleVar);
  if (ids.length > 40 && Math.random() > 0.1) {
    return;
  }

  for (const id of ids) {
    if (bot._throttleVar[id]!.lastRunTick + bot._throttleVar[id]!.interval <= bot.ticker) {
      delete bot._throttleVar[id];
    }
  }
}

function createIntervalTask(
  bot: mineflayer.Bot, 
  id: string, 
  task: () => void, 
  interval: number, 
  runImmediately = false
) {
  if (bot.taskList.some(task => task.id === id)) {
    throw new Error(`Task ${id} already exists`);
  }
  if (interval < 0) {
    throw new Error(`Interval ${interval} is not valid`);
  }
  bot.taskList.push({
    id,
    task,
    interval: interval,
    nextRunTick: bot.ticker + interval,
  })
  runImmediately && task();
}

function createOnceTask(
  bot: mineflayer.Bot,
  id: string,
  task: () => void,
  runAfterTick: number
) {
  const onceTask = () => {
    task();
    bot.removeTask(id);
  }
  createIntervalTask(bot, id, onceTask, runAfterTick, false);
}

function removeTask(bot: mineflayer.Bot, id: string) {
  for (let i = 0; i < bot.taskList.length; i++) {
    if (bot.taskList[i]!.id === id) {
      return bot.taskList.splice(i, 1)[0]!;
    }
  }
  return null;
}

function editTask(
  bot: mineflayer.Bot,
  id: string,
  interval: number,
  task?: () => void
) {
  const taskData = bot.taskList.find(t => t.id === id);
  if (taskData === undefined) {
    throw new Error(`Task ${id} not found`);
  }
  taskData.task = task || taskData.task;
  taskData.interval = interval;
}


export default function inject(bot: mineflayer.Bot) {
  bot.ticker = 0;
  bot._throttleVar = {};
  bot.throttle = (id, task, interval) => throttle(bot, id, task, interval);
  bot.editTask = (id, interval, task) => editTask(bot, id, interval, task);
  bot.removeTask = (id) => removeTask(bot, id);
  bot.createOnceTask = (id, task, runAfterTick) => createOnceTask(bot, id, task, runAfterTick);
  bot.createIntervalTask = (id, task, interval, runImmediately) => createIntervalTask(bot, id, task, interval, runImmediately);

  bot.on('physicsTick', () => {
    bot.ticker++;
    for (let i=bot.taskList.length-1; i>=0; i--) {
      const task = bot.taskList[i]!;
      if (bot.ticker >= task.nextRunTick) {
        task.task();
        task.nextRunTick = bot.ticker + task.interval;
      }
    }
  })
  pluginReady(bot, 'time');
}

interface Task {
  id: string,
  task: () => void,
  interval: number,
  nextRunTick: number,
}

interface ThrottleTaskInfo {
  interval: number,
  lastRunTick: number,
}


declare module 'mineflayer' {
  interface Bot {
    ticker: number;
    taskList: Task[];
    _throttleVar: Record<string, ThrottleTaskInfo>;
    createOnceTask(id: string, task: () => void, runAfterTick: number): void;
    createIntervalTask(id: string, task: () => void, interval: number, runImmediately?: boolean): void;
    editTask(id: string, interval: number, task?: () => void): void;
    removeTask(id: string): Task | null;
    throttle(id: string, task: () => void, interval: number): void;
  }
}
