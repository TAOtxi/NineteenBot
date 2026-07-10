import mineflayer from 'mineflayer'
import prismEntity from 'prismarine-entity';
import { killTask, afkTask, WITHER_SKULL_AFK_TASK, WITHER_SKULL_KILL_TASK } from '../task/witherSkull.js';
import { sleep } from '../utils/PromiseUtil.js';
import water from '../task/waterTree.js';
import TaskQueue from '../utils/TaskQueue.js';

type Runable = (bot: mineflayer.Bot) => void

function getTaskMap(): Record<string, Runable> {
  return {
    fish: fishTask,
    fish1: fishTask1,
    signIn: signIn,
    water: water,
    [WITHER_SKULL_AFK_TASK]: afkTask,
    [WITHER_SKULL_KILL_TASK]: killTask,
    empty: () => {}
  }
}


function fishTask(bot: mineflayer.Bot) {
  bot.once('spawn', () => {
    bot.chat('/stp survival2');

    bot.createOnceTimeTask("doFish", () => {
      bot.chat('/home fish');
      bot.startFishing();
      bot.enableAutoDrop();
      bot.startAutoReplace();
      bot.startAutoRepair();
    }, 20 * 10);
  })
}

function fishTask1(bot: mineflayer.Bot) {
  bot.once('spawn', () => {
    bot.chat('/stp survival');

    bot.createOnceTimeTask("doFish", () => {
      bot.chat('/home fish');
      bot.startFishing();
      bot.enableAutoDrop();
      bot.startAutoReplace();
      // bot.startAutoRepair();
    }, 20 * 10);
  })
}

// function toIndusty(bot: mineflayer.Bot) {
//   bot.createTimeTask('toIndustry', () => {

//   }, 20 * 10);
// }

function awaitEvent(bot: mineflayer.Bot, event: string, timeout: number = 20000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Event ${event} timeout ${timeout}ms`));
    }, timeout);

    function oncleanup() {
      clearTimeout(timer);
    }

    bot.once('cleanup', oncleanup);

    // @ts-ignore
    bot.once(event, () => {
      clearTimeout(timer);
      bot.off('cleanup', oncleanup);
      resolve();
    });
  })
}


async function signIn(bot: mineflayer.Bot) {
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


export {
  getTaskMap,

}