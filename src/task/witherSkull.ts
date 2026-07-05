import mineflayer from 'mineflayer'
import { sleep } from '../utils/PromiseUtil.js';

let isKillerReady = false;
const afkLocation = {
  wt1: '',
  wt2: '',
  wt3: '',
} as Record<string, string>;

const WITHER_SKULL_AFK_TASK = 'witherSkullAFKTask';
const WITHER_SKULL_KILL_TASK = 'witherSkullKillTask';

function killTask(bot: mineflayer.Bot) {
  isKillerReady = false;

  bot.once('cleanup', () => {
    isKillerReady = false;
  })

  bot.once('spawn', async () => {
    bot.chat('/stp industry');

    await sleep(2 * 1000);

    bot.chat('/home wtt');

    await sleep(2 * 1000);
    
    const window  = bot.currentWindow ?? bot.inventory;

    let isEquip = false;
    for (let i=window.inventoryStart; i<window.inventoryEnd; i++) {
      const item = window.slots[i];
      if (!item) continue;
      if (item.enchants?.length === 0) continue;
      
      if (item.enchants?.some(enchant => enchant.name === 'looting' && enchant.lvl >= 5)) {
        await bot.equip(item, 'hand');
        isEquip = true;
        break;
      }
    }
    if (!isEquip) {
      bot.baseWarn(WITHER_SKULL_KILL_TASK, 'No looting item found');
    }
    isKillerReady = true;
    bot.startAutoAttack();

    await sleep(5 * 1000);
    bot.enableTpsCheck();
  })
}

function popLocation(username: string) {
  for (const key in afkLocation) {
    if (afkLocation[key] === '') {
      afkLocation[key] = username;
      return key;
    }
  }
  return '';
}

function afkTask(bot: mineflayer.Bot) {
  bot.once('spawn', async () => {
    bot.chat('/stp industry');
    
    await sleep(2 * 1000);

    bot.chat('/spawn');

    await sleep(2 * 1000);

    bot.enableTpsCheck();

    bot.once('cleanup', () => {
      clearTimeout(timer);
    })

    const timer = setTimeout(() => {
      bot.baseError(WITHER_SKULL_AFK_TASK, 'AFK timeout');
      bot.removeTimeTask(WITHER_SKULL_AFK_TASK);
    }, 90 * 1000);

    bot.createTimeTask(WITHER_SKULL_AFK_TASK, () => {
      if (!isKillerReady) return;
      clearTimeout(timer);
      bot.removeTimeTask(WITHER_SKULL_AFK_TASK);

      const des = popLocation(bot.username);
      if (des === '') {
        bot.baseError(WITHER_SKULL_AFK_TASK, 'AFK location is full');
        bot.tryExecute(`/task remove ${WITHER_SKULL_AFK_TASK}`);
        return;
      }

      bot.once('cleanup', () => {
        afkLocation[des] = '';
      })
      bot.chat(`/home ${des}`);
    }, 20, true);
  })
}

export {
  killTask,
  afkTask,
  WITHER_SKULL_AFK_TASK,
  WITHER_SKULL_KILL_TASK,
}