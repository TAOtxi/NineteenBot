import mineflayer from 'mineflayer'
import prismEntity from 'prismarine-entity';
import { sleep } from '../utils/PromiseUtil.js';

function getTaskMap(): Record<string, Runable> {
  return {
    fish: fishTask,
    fish1: fishTask1,
    signIn: signIn,
    water: water,
    witherSkull: witherSkullTask,
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

const witherSkullTaskReady: string[] = [];
function witherSkullTask(bot: mineflayer.Bot) {
  bot.once('spawn', async () => {
    bot.chat('/stp industry');

    bot.createOnceTimeTask('toDes', async () => {
      if (bot.username === 'Amumu_l') {
        bot.chat('/spawn');
        witherSkullTaskReady.push(bot.username);
      } else if (bot.username === 'Suki_xi') {
        bot.chat('/spawn');
        witherSkullTaskReady.push(bot.username);
      } else if (bot.username === 'Mar1mo_') {
        bot.chat('/home wtt');

        await sleep(2000);
        const window  = bot.currentWindow ?? bot.inventory;
        for (let i=window.inventoryStart; i<window.inventoryEnd; i++) {
          const item = window.slots[i];
          if (!item) continue;
          if (item.enchants?.length === 0) continue;
          
          if (item.enchants?.some(enchant => enchant.name === 'looting' && enchant.lvl >= 5)) {
            await bot.equip(item, 'hand');
            break;
          }
        }

        bot.once('cleanup', () => {
          bot.removeTimeTask('waitingForLogining');
        })
        bot.createTimeTask('waitingForLogining', () => {
          bot.baseInfo('witherSkullTask', 'Waiting for Other Player login in...');
          if (witherSkullTaskReady.includes('Amumu_l') && witherSkullTaskReady.includes('Suki_xi')) {
            bot.chat('/w Amumu_l /home wt1');
            bot.chat('/w Suki_xi /home wt2');
            bot.removeTimeTask('waitingForLogining');
            witherSkullTaskReady.length = 0;
            bot.startAutoAttack();
          }
        }, 20, true);

      }

      await sleep(5 * 1000);
      bot.enableTpsCheck();
    }, 20 * 5);
  })
}

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

async function water(bot: mineflayer.Bot) {
  if (bot._initTask.includes('fish') || bot._initTask.includes('fish1')) {
    bot.disableAutoDrop();
  }

  if (bot.currentWindow !== null) {
    bot.closeWindow(bot.currentWindow);
  }

  const diamondId = bot.registry.itemsByName['diamond']?.id;

  // 捡到钻石就开始神树浇水
  await new Promise(async resolve => {
    function onPickDiamond(player: prismEntity.Entity, item: prismEntity.Entity) {
      if (player.username !== bot.username) return;
      // @ts-ignore
      const itemId = item.metadata[8]?.itemId;
      if (!itemId || itemId !== diamondId) return;
      bot.off('playerCollect', onPickDiamond);
      resolve(1);
    }

    bot.on('playerCollect', onPickDiamond);
  })

  const taskQueue = TaskQueue.createTaskQueue(bot, 'water');
  taskQueue
    .addTask(async () => {
      bot.chat("/guilds open");
      // await awaitEvent(bot, 'windowOpen');
    })
    .addTask(async () => {
      await bot.clickWindow(14, 0, 0);
      // await awaitEvent(bot, 'windowOpen');
    })
    .addTask(async () => await bot.clickWindow(38, 0, 0))
    .addTask(async () => await bot.clickWindow(38, 0, 0))
    .addTask(async () => await bot.clickWindow(38, 0, 0))
    .addTask(async () => await bot.clickWindow(40, 0, 0))
    .addTask(async () => await bot.clickWindow(40, 0, 0))
    .addTask(async () => await bot.clickWindow(41, 0, 0))
    .addTask(async () => await bot.clickWindow(42, 0, 0))
    .addTask(async () => await bot.clickWindow(29, 0, 0))
    .addTask(() => bot.closeContainer())
    .addTask(() => {
      if (bot._initTask.includes('fish') || bot._initTask.includes('fish1')) {
        bot.enableAutoDrop();
      }
    })
  
  try {
    await taskQueue.buid();
  } catch (error) {
    bot.baseError('WaterTask', error as string);
  }
}


type Runable = (bot: mineflayer.Bot) => void
type RunableTask = () => Promise<void> | void

class Task {
  public task: RunableTask;
  public minDelay: number;

  constructor(task: RunableTask, delay: number = -1) {
    this.task = task;
    this.minDelay = delay;
  }

  run() {
    return this.task();
  }
}

class TaskQueue {
  private id: string;
  private taskList: Task[];
  private bot: mineflayer.Bot;

  constructor(bot: mineflayer.Bot, id: string) {
    this.id = id;
    this.taskList = [];
    this.bot = bot;
  }

  static createTaskQueue(bot: mineflayer.Bot, id: string) {
    return new TaskQueue(bot, id);
  }

  addTask(task: RunableTask, minDelay: number = 0) {
    if (this.taskList.at(-1) !== undefined && this.taskList.at(-1)!.minDelay < 0) {
      throw new Error('Task delay must be greater than 0');
    }
    this.taskList.push(new Task(task, minDelay))
    return this;
  }

  async buid() {
    if (this.taskList.length === 0) {
      throw new Error(`TaskQueue ${this.id} is empty`);
    }
    
    for (let i = 0; i < this.taskList.length; i++) {
      const lastRunTick = this.bot.ticker;
      const task = this.taskList[i];
      if (!task) {
        throw new Error(`TaskQueue ${this.id} task ${i} is undefined`);
      }
      await task.run();
      
      const delta = task.minDelay - (this.bot.ticker - lastRunTick);
      if (delta > 0) {
        await this.bot.createOnceTimeTask(
          `waiting_${this.id}_${i}`, 
          () => {}, delta
        );
      }
    }
  }
}

export {
  getTaskMap,

}