import mineflayer from 'mineflayer';
import TaskQueue from '@/utils/TaskQueue.js';
import { getItemNameWithAnsiColor, getAnsi } from '@/utils/game/itemUtil.js';

export default async function task(bot: mineflayer.Bot) {
  const taskQueue = TaskQueue.createTaskQueue(bot, 'showDailyTask');
  taskQueue
    .addTask(() => bot.chat('/dq'), 5)
    .addTask(() => {
      if (!bot.currentWindow) {
        bot.baseError('ShowDailyTask', 'No current window found');
        return;
      }

      for (const slot of [11, 13, 15]) {
        const item = bot.currentWindow.slots[slot];
        const taskIndex = (slot - 9) / 2;
        if (item) {
          bot.baseInfo(`${taskIndex}. ${getItemNameWithAnsiColor(item)}:`);
          bot.baseInfo(`\t${getAnsi(item.customLore?.[0])}`);
          bot.baseInfo(`\t${getAnsi(item.customLore?.[1])}`);
          bot.baseInfo(`\t${getAnsi(item.customLore?.[2])}`);
        } else {
          bot.baseInfo(`Task ${taskIndex}: None`);
        }
      }
      bot.closeWindow(bot.currentWindow);
    })
  try {
    await taskQueue.buid();
  } catch (error) {
    bot.baseError('ShowDailyTask', error as string);
  }
}