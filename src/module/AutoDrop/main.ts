import fs from 'fs';
import mineflayer from 'mineflayer';
import prisItem from 'prismarine-item';
import Logger from '../../utils/Logger.js';
import { type Config, type Item } from './config.js';
import StringUtil from '../../utils/StringUtil.js';


let bot: mineflayer.Bot;
let config: Config;
let tickCounter = 0;
let enabled = false;
const logger = Logger.getLogger('AutoDrop');

function loadConfig(path: string = './config/AutoDrop.json') {
  if (!fs.existsSync(path)) {
    throw new Error(`Config file not found: ${path}`);
  }

  const data = fs.readFileSync(path);
  config = JSON.parse(data.toString());
}

function tick(runImmediately = false) {
  if (!enabled && !runImmediately) {
    return;
  }
  tickCounter++;
  if (!runImmediately && tickCounter % config.checkInterval !== 0) {
    return;
  }

  const l = bot.inventory.inventoryStart;
  const r = bot.inventory.inventoryEnd;
  const needDropSlots: number[] = [];
  for (let i = l; i <= r; i++) {
    const item = bot.inventory.slots[i];
    if (!item) {
      continue;
    }
    if ((config.dropMode === 'whitelist' && !match(item)) ||
      (config.dropMode === 'blacklist' && match(item))) {
      needDropSlots.push(i);
    }
  }
  handleDrop(needDropSlots);

}


function match(item: prisItem.Item) {
  for (const itemCheck of config.items) {
    // TODO: 待寻找翻译方式
    // name <Golden Apple>
    if (itemCheck.name !== '*' && !StringUtil.regMatchOrEqual(itemCheck.name, item.displayName)) {
      continue;
    }
    // TODO: 正则匹配是为了弥补不能获取物品的标签的问题，待日后寻找获取标签方法
    // id <golden_apple>
    if (itemCheck.id !== '*' && !StringUtil.regMatchOrEqual(itemCheck.id, item.name)) {
      continue;
    }
    if (!itemCheck.enchants) {
      return true;
    }
    const itemEnts: Record<string, number> = item.enchants.reduce((acc, cur) => ({ ...acc, [cur.name]: cur.lvl }), {});
    let enchantCounts = 0;
    // enchantment
    for (const { name, lvl } of itemCheck.enchants) {
      if (itemEnts[name] !== undefined && itemEnts[name] >= lvl) {
        enchantCounts++;
      }
    }

    if (enchantCounts < (itemCheck.minEntCounts ?? item.enchants.length)) {
      continue;
    }
    return true;
  }
  return false;
}


function handleDrop(slot: number[]) {
  if (config.dropDirection === 'look') {
    slot.forEach(dropItemAll);
    return;
  }
  const botYaw = bot.entity.yaw;
  const botPitch = bot.entity.pitch;

  const { yaw: dropYaw, pitch: dropPitch } = getDropAngle(config.dropDirection);
  bot.look(dropYaw, dropPitch, true);
  
  setTimeout(() => {
    slot.forEach(dropItemAll);
    bot.look(botYaw, botPitch, true);  // turn back
  }, 1000);
}

function dropItemAll(slot: number) {
  // bot.inventory.dropClick({
  //   mode: 4,
  //   mouseButton: 1,
  //   slot,
  // });
  bot.clickWindow(slot, 1, 4);
}

function getNoneEmptySlot() {
  const slots: number[] = [];
  const l = bot.inventory.inventoryStart;
  const r = bot.inventory.inventoryEnd;
  for (let i = l; i <= r; i++) {
    const item = bot.inventory.slots[i];
    if (item) {
      slots.push(i);
    }
  }
  return slots;
}

function getDropAngle(dirction: Config['dropDirection']) {
  switch (dirction) {
    case 'down':
      return { yaw: 0, pitch: -Math.PI / 2 };
    case 'up':
      return { yaw: 0, pitch: Math.PI / 2 };
    case 'west':
      return { yaw: Math.PI, pitch: 0 };
    case 'south':
      return { yaw: -Math.PI / 2, pitch: 0 };
    case 'east':
      return { yaw: 0, pitch: 0 };
    case 'north':
      return { yaw: Math.PI / 2, pitch: 0 };
    case 'look':
    default:
      return { yaw: bot.entity.yaw, pitch: bot.entity.pitch };
  }
}

function getConfig() {
  if (!config) {
    loadConfig();
  }
  return config;
}

function getLogger() {
  return logger;
}

function init(newBot: mineflayer.Bot) {
  bot = newBot;

  if (!config) {
    loadConfig();
  }
}

function setEnabled(newEnabled: boolean) {
  enabled = newEnabled;
}

function isEnabled() {
  return enabled;
}


export default {
  tick,
  init,
  getConfig,
  getLogger,
  getNoneEmptySlot,
  setEnabled,
  isEnabled,
  loadConfig,
}