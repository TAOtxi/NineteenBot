import mineflayer from 'mineflayer';
import prisItem from 'prismarine-item';
import StringUtil from '../utils/StringUtil.js';
import { pluginReady, waitPluginLoads } from '../utils/pluginWaiter.js';


const namespace = 'autodrop';
const defaultConfig: Config = {
  enabled: false,
  ignoreSlots: [],
  dropViewPoint: '',
  dropDirection: "look",
  checkInterval: 40,
  dropMode: "whitelist",
  items: [
    {
      name: "*",
      id: "/^(diamond|netherite)_(sword|axe)$/",
      enchants: [
        { name: "sharpness", lvl: 5 },            // 锋利
        { name: "smite", lvl: 5 },                // 亡灵杀手
        { name: "bane_of_arthropods", lvl: 5 }    // 节肢杀手
      ]
    }
  ]
}

function isMatch(item: prisItem.Item, checkItems: Config['items']) {
  for (const checker of checkItems) {
    // TODO: 待寻找翻译方式
    // name <Golden Apple>
    if (checker.name !== '*' && !StringUtil.regMatchOrEqual(checker.name, item.customName ?? item.displayName)) {
      continue;
    }
    // TODO: 正则匹配是为了弥补不能获取物品的标签的问题，待日后寻找获取标签方法
    // id <golden_apple>
    if (checker.id !== '*' && !StringUtil.regMatchOrEqual(checker.id, item.name)) {
      continue;
    }
    if (!checker.enchants) {
      return true;
    }
    const itemEnts: Record<string, number> = item.enchants.reduce((acc, cur) => ({ ...acc, [cur.name]: cur.lvl }), {});
    let enchantCounts = 0;
    // enchantment
    for (const { name, lvl } of checker.enchants) {
      if (itemEnts[name] !== undefined && itemEnts[name] >= lvl) {
        enchantCounts++;
      }
    }

    if (enchantCounts < (checker.minEntCounts ?? item.enchants.length)) {
      continue;
    }
    return true;
  }
  return false;
}

function handleDrop(bot: mineflayer.Bot, slot: number[], dropDirection: string) {
  if (dropDirection === 'look') {
    slot.forEach(slot => dropSlot(bot, slot));
    return;
  }

  if (!bot._autodrop_isTurnBack) {
    slot.forEach(slot => dropSlot(bot, slot));
    return;
  }

  const botYaw = bot.entity.yaw;
  const botPitch = bot.entity.pitch;
  
  const { yaw: dropYaw, pitch: dropPitch } = getDropAngle(bot, dropDirection);
  const yawOffset = -Math.PI;
  bot.look(dropYaw + yawOffset, dropPitch, true);
  bot._autodrop_isTurnBack = false;

  
  setTimeout(() => {
    slot.forEach(slot => dropSlot(bot, slot));
    bot.look(botYaw, botPitch, true);  // turn back
    bot._autodrop_isTurnBack = true;
  }, 1000);
}

function dropSlot(bot: mineflayer.Bot, slot: number) {
  // bot.inventory.dropClick({
  //   mode: 4,
  //   mouseButton: 1,
  //   slot,
  // });
  bot.clickWindow(slot, 1, 4);
}

  
function tryDrop(bot: mineflayer.Bot) {
  const l = bot.inventory.inventoryStart;
  const r = bot.inventory.inventoryEnd;
  const needDropSlots: number[] = [];
  const dropMode = bot._autodrop('dropMode');
  const checkItems = bot._autodrop('items');
  for (let i = l; i <= r; i++) {
    const item = bot.inventory.slots[i];
    if (!item) {
      continue;
    }
    if ((dropMode === 'whitelist' && !isMatch(item, checkItems)) ||
      (dropMode === 'blacklist' && isMatch(item, checkItems))) {
      needDropSlots.push(i);
    }
  }
  handleDrop(bot, needDropSlots, bot._autodrop('dropViewPoint') || bot._autodrop('dropDirection'));
}

function getDropAngle(bot: mineflayer.Bot, dirction: string) {
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
      return { yaw: bot.entity.yaw, pitch: bot.entity.pitch };
    default:
      const match = dirction.match(/<(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)>/);
      if (match) {
        return { yaw: parseFloat(match[1]!), pitch: parseFloat(match[2]!) };
      }
      console.log(`Invalid drop direction ${dirction}.`);
      return { yaw: bot.entity.yaw, pitch: bot.entity.pitch };
  }
}


export default async function inject(bot: mineflayer.Bot) {
  await waitPluginLoads(bot, ['makeConfig', 'logger']);

  bot.loadConfig(namespace, defaultConfig);
  bot._autodrop = (key: string) => bot.getConfig(namespace, key);
  bot._autodrop_isTurnBack = true;
  bot.tryDrop = () => tryDrop(bot);

  bot.enableAutoDrop = (delay?: number) => {
    if (delay) {
      setTimeout(() => {
        bot.setConfig(namespace, 'enabled', true);
      }, delay);
    } else {
      bot.setConfig(namespace, 'enabled', true);
    }
  }

  bot.disableAutoDrop = () => {
    bot.setConfig(namespace, 'enabled', false);
  }

  let lastTick = 0;
  bot.on('physicsTick', () => {
    if (!bot._autodrop('enabled')) {
      return;
    }
    lastTick++;
    if (lastTick % bot._autodrop('checkInterval') !== 0) {
      return;
    }
    tryDrop(bot);
  });
}


declare module 'mineflayer' {
  interface Bot {
    _autodrop_isTurnBack: boolean;
    _autodrop(key: string): any | undefined;
    tryDrop(): void;
    enableAutoDrop(delay?: number): void;
    disableAutoDrop(): void;
  }
}


interface Config {
  enabled: boolean;
  ignoreSlots: number[];
  dropViewPoint: string;  // 格式为<yaw, pitch>, 如果不是空字符串，则优先级高于dropDirection
  dropDirection: 'east' | 'west' | 'north' | 'south' | 'look' | 'up' | 'down';
  checkInterval: number;
  dropMode: 'whitelist' | 'blacklist';
  items: {
    name: string;   // string or regex pattern (e.g. '/^Golden Apple$/')
    id: string;     // https://zh.minecraft.wiki/w/Java版数据值#物品
    enchants?: {    // https://zh.minecraft.wiki/w/Java版数据值#魔咒
      name: string;
      lvl: number;
    }[];
    minEntCounts?: number;
  }[];
}
