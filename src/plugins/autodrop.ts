import mineflayer from 'mineflayer';
import prisItem from 'prismarine-item';
import StringUtil from '../utils/StringUtil.js';
import { pluginReady, waitPluginLoads } from '../utils/pluginWaiter.js';
import CmdParser from '../utils/CmdParser.js';


const pluginName = 'autodrop';
const defaultConfig: Config = {
  ignoreSlots: [],
  useDropRotation: false,
  dropYaw: 0,
  dropPitch: 0,
  dropDirection: "look",
  checkInterval: 40,
  dropMode: "whitelist",
  triggerMinNotEmptySlots: 20,
  items: [
    {
      // /give @a minecraft:diamond_sword[minecraft:enchantments={sharpness:5,smite:5,bane_of_arthropods:5}]
      enabled: true,
      name: "*",
      id: "/^(?:diamond|netherite)_(?:sword|axe)$/",
      minEntCounts: 2,
      enchants: [
        { name: "sharpness", lvl: 5 },            // 锋利
        { name: "smite", lvl: 5 },                // 亡灵杀手
        { name: "bane_of_arthropods", lvl: 5 }    // 节肢杀手
      ]
    },
    {
      enabled: true,
      name: "*",
      id: "/^(?:diamond|netherite)_(?:helmet|chestplate|leggings|boots)$/",
      minEntCounts: 3,
      enchants: [
        { name: "protection", lvl: 4 },               // 保护
        { name: "projectile_protection", lvl: 4 },    // 弹射物保护
        { name: "blast_protection", lvl: 4 },         // 爆炸保护
        { name: "fire_protection", lvl: 4 }           // 火焰保护
      ]
    }
  ]
}

function showHelp(bot: mineflayer.Bot) {
  bot.baseInfo(pluginName, 'autodrop help');
}

function getNotEmptySlot(bot: mineflayer.Bot) {
  const l = bot.inventory.inventoryStart;
  const r = bot.inventory.inventoryEnd;

  const ignoreSlots: number[] = [];
  for (let i = l; i <= r; i++) {
    if (bot.inventory.slots[i]) {
      ignoreSlots.push(i);
    }
  }
  return ignoreSlots;
}

function ignoreCurrentSlot(bot: mineflayer.Bot) {
  const ignoreSlots = getNotEmptySlot(bot);
  bot.setConfig(pluginName, 'ignoreSlots', ignoreSlots);
}

function isMatch(item: prisItem.Item, checkItems: Config['items']) {
  for (const checker of checkItems) {
    if (!checker.enabled) {
      continue;
    }
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

    if (!checker.enchants || checker.enchants.length === 0) {
      return true;
    }
    
    if (checker.minEntCounts === undefined || checker.minEntCounts === 0) {
      return true;
    }

    const minEntCounts = checker.minEntCounts === -1 ? 
        checker.enchants.length : 
        checker.minEntCounts;

    if (minEntCounts > checker.enchants.length) {
      continue; // 不可能通过匹配
    }
    const itemEnts: Record<string, number> = item.enchants.reduce((acc, cur) => ({ ...acc, [cur.name]: cur.lvl }), {});
    let enchantMatchCounts = 0;

    // enchantment
    for (const { name, lvl } of checker.enchants) {
      if (itemEnts[name] !== undefined && itemEnts[name] >= lvl) {
        enchantMatchCounts++;
      }
    }

    if (enchantMatchCounts >= minEntCounts) {
      return true;
    }
  }
  return false;
}

function handleDrop(bot: mineflayer.Bot, slot: number[]) {
  if (bot.hasTimeTask('autodrop_drop_task')) {
    return;
  }

  if (!bot._autodrop('useDropRotation') && bot._autodrop('dropDirection') === 'look') {
    slot.forEach(slot => dropSlot(bot, slot));
    return;
  }

  const originYaw = bot.entity.yaw;
  const originPitch = bot.entity.pitch;

  if (bot._autodrop('useDropRotation')) {
    bot.look(bot._autodrop('dropYaw'), bot._autodrop('dropPitch'), true);
  } else {
    bot.setDirection(bot._autodrop('dropDirection'));
  }

  bot.createOnceTimeTask('autodrop_drop_task', 20, bot => {
    slot.forEach(slot => dropSlot(bot, slot));
    bot.look(originYaw, originPitch, true);
  })
}

function dropSlot(bot: mineflayer.Bot, slot: number) {
  // bot.inventory.dropClick({
  //   mode: 4,
  //   mouseButton: 1,
  //   slot,
  // });
  bot.clickWindow(slot, 1, 4);
}
  
function tick(bot: mineflayer.Bot) {
  const l = bot.inventory.inventoryStart;
  const r = bot.inventory.inventoryEnd;
  const needDropSlots: number[] = [];
  const dropMode = bot._autodrop('dropMode');
  const checkItems = bot._autodrop('items');
  for (let i = l; i <= r; i++) {
    if (bot._autodrop('ignoreSlots').includes(i)) {
      continue;
    }
    const item = bot.inventory.slots[i];
    if (!item) continue;

    if ((dropMode === 'whitelist' && !isMatch(item, checkItems)) ||
      (dropMode === 'blacklist' && isMatch(item, checkItems))) {
      needDropSlots.push(i);
    }
  }
  handleDrop(bot, needDropSlots);
}

function registCmd(bot: mineflayer.Bot) {
  const CommandManager = bot.getCommandManager();
  bot.registerCmd(CommandManager.command([pluginName, 'ad'])
    .execute(showHelp)
    .then(CommandManager.command('on').execute(bot => bot._autodrop_enabled = true))
    .then(CommandManager.command('off').execute(bot => bot._autodrop_enabled = false))
    .then(CommandManager.command('test').execute(tick))
    .then(CommandManager.command('ignore')
      .then(CommandManager.command('current').execute(ignoreCurrentSlot))
      .then(CommandManager.command('reset').execute(bot => bot.setConfig(pluginName, 'ignoreSlots', [])))
      .then(CommandManager.command('add')
        .then(CommandManager.value('<slot1>,<slot2>,<slot3>...>').execute((bot, value) => {
          const slots = CmdParser.parseArrayInt(value);
          if (!slots.length) {
            bot.baseError(pluginName, 'Slot value is empty.');
            return;
          }
          const newIgnoreSlots = [...new Set([...bot._autodrop('ignoreSlots'), ...slots])];
          bot.setConfig(pluginName, 'ignoreSlots', newIgnoreSlots);
        }))
      )
      .then(CommandManager.command('set')
        .then(CommandManager.value('<slot1>,<slot2>,<slot3>...>').execute((bot, value) => {
          const slots = CmdParser.parseArrayInt(value);
          if (!slots.length) {
            bot.baseError(pluginName, 'Slot value is empty.');
            return;
          }
          bot.setConfig(pluginName, 'ignoreSlots', slots);
        }))
      )
    )
    .then(CommandManager.command('set')
      .then(CommandManager.argument(['-it', '--interval']).execute((bot, value) => {
          if (!value) {
            bot.baseError(pluginName, 'Interval value is empty.');
            return;
          }
          const interval = parseInt(value);
          bot.updateTimeTask(pluginName, interval);
          bot.setConfig(pluginName, 'checkInterval', interval);
          bot.baseInfo(pluginName, `Interval set to ${interval}`);
      }))
      .then(CommandManager.argument(['-m', '--mode']).execute((bot, value) => {
        if (!value || !['whitelist', 'blacklist'].includes(value)) {
          bot.baseError(pluginName, 'Mode value is invalid.');
          return;
        }
        bot.setConfig(pluginName, 'dropMode', value);
        bot.baseInfo(pluginName, `Mode set to ${value}`);
      }))
      .then(CommandManager.argument(['-d', '--direction']).execute((bot, value) => {
        if (!value) {
          bot.baseError(pluginName, 'Direction value is empty.');
          return;
        }
        bot.setConfig(pluginName, 'dropDirection', value);
        bot.baseInfo(pluginName, `Direction set to ${value}`);
      }))
      .then(CommandManager.argument(['-r', '--rotation']).execute((bot, value) => {
        if (!value) {
          bot.baseError(pluginName, 'Rotation value is empty.');
          return;
        }
        const rotation = StringUtil.stringToList(value, ',', parseFloat);
        if (rotation.length !== 2) {
          bot.baseError(pluginName, 'Rotation value is invalid.');
          return;
        }
        bot.setConfig(pluginName, 'dropYaw', rotation[0]);
        bot.setConfig(pluginName, 'dropPitch', rotation[1]);
        bot.baseInfo(pluginName, `Rotation set to ${value}`);
      }))
      .then(CommandManager.argument('--dropWay')
        .execute((bot, way) => {
          if (!['direction', 'rotation'].includes(way)) {
            bot.baseError(pluginName, `Value ${way} is invalid.`);
            return;
          }
          bot.setConfig(pluginName, 'useDropRotation', way === 'rotation');
          bot.baseInfo(pluginName, `Drop way set to ${way}`);
        }))
    )
    .then(CommandManager.command('config')
      .then(CommandManager.command('show').execute(bot => {
        bot.withoutLogTitle().baseInfo(pluginName, JSON.stringify(bot.configMap[pluginName], null, 2));
      }))
      .then(CommandManager.command('reload').execute(bot => {
        bot.loadConfig(pluginName, defaultConfig);
        bot.updateTimeTask(pluginName, bot._autodrop('checkInterval'));
        bot.baseInfo(pluginName, 'Config reloaded.');
      }))
    )
  )
}


export default async function inject(bot: mineflayer.Bot) {
  await waitPluginLoads(bot, ['makeConfig', 'logger', 'command', 'task', 'action']);
  bot._autodrop_enabled = false;
  
  bot.loadConfig(pluginName, defaultConfig);
  bot._autodrop = (key: string) => bot.getConfig(pluginName, key);
  bot._autodrop_isTurnBack = true;
  bot.tryDrop = () => tick(bot);

  bot.enableAutoDrop = (delay?: number) => {
    if (delay) {
      setTimeout(() => {
        if (!bot) return;
        bot._autodrop_enabled = true;
      }, delay);
    } else {
      bot._autodrop_enabled = true;
    }
  }

  bot.disableAutoDrop = () => {
    bot._autodrop_enabled = false;
  }

  bot.createTimeTask(pluginName, bot._autodrop('checkInterval'), bot => {
    if (bot._autodrop_enabled &&
        getNotEmptySlot(bot) > bot._autodrop('triggerMinNotEmptySlots')
    ) {
      tick(bot);
    }
  });

  registCmd(bot);
}


declare module 'mineflayer' {
  interface Bot {
    _autodrop_isTurnBack: boolean;
    _autodrop_enabled: boolean;
    _autodrop(key: string): any | undefined;
    tryDrop(): void;
    enableAutoDrop(delay?: number): void;
    disableAutoDrop(): void;
  }
}


interface Config {
  ignoreSlots: number[];
  useDropRotation: boolean;
  dropYaw: number;
  dropPitch: number;
  dropDirection: string;
  checkInterval: number;
  dropMode: 'whitelist' | 'blacklist';
  triggerMinNotEmptySlots: number;
  items: {
    enabled: boolean;
    name: string;   // string or regex pattern (e.g. '/^Golden Apple$/')
    id: string;     // https://zh.minecraft.wiki/w/Java版数据值#物品
    enchants?: {    // https://zh.minecraft.wiki/w/Java版数据值#魔咒
      name: string;
      lvl: number;
    }[];
    minEntCounts?: number;
  }[];
}
