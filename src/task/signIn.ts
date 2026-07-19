import mineflayer from 'mineflayer';
import { awaitEvent } from '../utils/PromiseUtil.js';
import TaskQueue from '../utils/TaskQueue.js';


export default async function signIn(bot: mineflayer.Bot) {
  const taskQueue = TaskQueue.createTaskQueue(bot, 'signIn');
  taskQueue
    .addTask(() => bot.chat('/19'))
    .addTask(() => awaitEvent(bot, 'windowOpen'))
    .addTask(() => bot.clickWindow(33, 0, 0))
    .addTask(() => awaitEvent(bot, 'windowOpen'))
    .addTask(() => bot.clickWindow(20, 0, 0))
    .addTask(() => awaitEvent(bot, 'windowOpen'))
    .addTask(() => {
      const day = new Date().getDate();
      const row = Math.floor((day - 1) / 8);
      const col = (day - 1) % 8;
      const slot = row * 9 + col;
      bot.clickWindow(slot, 0, 0);
    })
    .addTask(() => {
      if (bot.currentWindow !== null) {
        bot.closeWindow(bot.currentWindow);
      }
    })

  try {
    await taskQueue.buid();
  } catch (error) {
    bot.baseError('SignInTask', error as string);
  }
}