import mineflayer from 'mineflayer';
import prismEntity from 'prismarine-entity';
import TaskQueue from '../utils/TaskQueue.js';


export default async function water(bot: mineflayer.Bot) {
  const hasFishTask = bot._initTask.includes('fish') || bot._initTask.includes('fish1');
  if (hasFishTask) {
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
    }, 20)
    .addTask(() => {
      bot.clickWindow(14, 0, 0);
      // await awaitEvent(bot, 'windowOpen');
    }, 20)
    .addTask(() => bot.clickWindow(38, 0, 0), 5)
    .addTask(() => bot.clickWindow(38, 0, 0), 5)
    .addTask(() => bot.clickWindow(38, 0, 0), 5)
    .addTask(() => bot.clickWindow(40, 0, 0), 5)
    .addTask(() => bot.clickWindow(40, 0, 0), 5)
    .addTask(() => bot.clickWindow(41, 0, 0), 5)
    .addTask(() => bot.clickWindow(42, 0, 0), 5)
    .addTask(() => bot.clickWindow(29, 0, 0), 5)
    .addTask(() => bot.closeContainer())
    .addTask(() => {
      if (hasFishTask) {
        bot.enableAutoDrop();
      }
    })
  
  try {
    await taskQueue.buid();
  } catch (error) {
    bot.baseError('WaterTask', error as string);
    bot.closeContainer();
  }
}