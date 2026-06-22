import mineflayer from 'mineflayer';
import prisItem from 'prismarine-item';
import prismEntity from 'prismarine-entity';
import StringUtil from '../utils/StringUtil.js';
import { pluginReady, waitPluginLoads } from '../utils/pluginWaiter.js';
import CmdParser from '../utils/CmdParser.js';


const pluginName = 'autodrop';
const defaultConfig: Config = {
  ignoreSlots: [],
  useDropRotation: false,
  dropRotation: {
    yaw: 0,
    pitch: 0,
  },
  dropDirection: "look",
  triggerInterval: 3600,
  dropMode: "whitelist",
  triggerMinNotEmptySlots: 0,
  triggerByTime: true,
  triggerByItem: false,
  triggerItemId: "*",
  items: [
    {
      // /give @a minecraft:diamond_sword[minecraft:enchantments={sharpness:5,smite:5,bane_of_arthropods:5}]
      id: "/^(?:diamond|netherite)_(?:sword|axe)$/",
      minEntCounts: 2,
      enchants: [
        { name: "sharpness", lvl: 5 },            // 锋利
        { name: "smite", lvl: 5 },                // 亡灵杀手
        { name: "bane_of_arthropods", lvl: 5 }    // 节肢杀手
      ]
    },
    {
      id: "/_(?:sword|axe)$/",
      minEntCounts: -1,
      enchants: [
        { name: "sharpness", lvl: 5 },
        { name: "smite", lvl: 5 },
        { name: "bane_of_arthropods", lvl: 5 }
      ]
    },
    {
      id: "/^(?:diamond|netherite)_(?:helmet|chestplate|leggings|boots)$/",
      minEntCounts: 3,
      enchants: [
        { name: "protection", lvl: 4 },               // 保护
        { name: "projectile_protection", lvl: 4 },    // 弹射物保护
        { name: "blast_protection", lvl: 4 },         // 爆炸保护
        { name: "fire_protection", lvl: 4 }           // 火焰保护
      ]
    },
    {
      id: "/_(?:helmet|chestplate|leggings|boots)$/",
      minEntCounts: -1,
      enchants: [
        { name: "protection", lvl: 4 },
        { name: "projectile_protection", lvl: 4 },
        { name: "blast_protection", lvl: 4 },
        { name: "fire_protection", lvl: 4 }
      ]
    },
    {
      id: "bow",
      minEntCounts: -1,
      enchants: [
        { name: "mending", lvl: 1 },
        { name: "infinity", lvl: 1 }
      ]
    },
    {
      enabled: true,
      id: "/^diamond(?:_block)?$/",
    },
    {
      enabled: true,
      id: "paper",
    },
    {
      enabled: true,
      id: "fishing_rod",
    },
    {
      enabled: true,
      id: "/^netherite.*$/",
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
  for (let i = l; i < r; i++) {
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

function isItemMatch(bot: mineflayer.Bot, item: prisItem.Item) {
  return isMatch(item, bot.getConfig(pluginName, 'items'));
}

function isMatch(item: prisItem.Item, checkItems: Config['items']) {
  for (const checker of checkItems) {
    if (!(checker.enabled ?? true)) {
      continue;
    }
    // TODO: 待寻找翻译方式
    // name <Golden Apple>
    if (checker.name !== '*' &&
        checker.name !== undefined &&
        !StringUtil.regMatchOrEqual(checker.name, item.customName ?? item.displayName)
    ) {
      continue;
    }

    // TODO: 正则匹配是为了弥补不能获取物品的标签的问题，待日后寻找获取标签方法
    // id <golden_apple>
    if (checker.id !== '*' &&
        checker.id !== undefined &&
        !StringUtil.regMatchOrEqual(checker.id, item.name)
    ) {
      continue;
    }

    // durability
    if (item.maxDurability !== undefined && checker.durability !== undefined) {
      if (checker.durability === -1 && item.durabilityUsed !== 0) {
        continue;
      }
      if (checker.durability === -2 && item.durabilityUsed == 0) {
        continue;
      }
      if (item.maxDurability - item.durabilityUsed < checker.durability) {
        continue;
      }
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

  const useDropRotation = bot.getConfig(pluginName, 'useDropRotation');

  if (!useDropRotation && bot.getConfig(pluginName, 'dropDirection') === 'look') {
    slot.forEach(slot => dropSlot(bot, slot));
    return;
  }

  const originYaw = bot.entity.yaw;
  const originPitch = bot.entity.pitch;

  if (useDropRotation) {
    const dropRotation = bot.getConfig(pluginName, 'dropRotation');
    bot.look2(dropRotation.yaw, dropRotation.pitch, true);
  } else {
    bot.setDirection(bot.getConfig(pluginName, 'dropDirection'));
  }

  bot.createOnceTimeTask('autodrop_drop_task', bot => {
    slot.forEach(slot => dropSlot(bot, slot));
    bot.look(originYaw, originPitch, true);
  }, 15)
}

function dropSlot(bot: mineflayer.Bot, slot: number) {
  // bot.inventory.dropClick({
  //   mode: 4,
  //   mouseButton: 1,
  //   slot,
  // });
  bot.clickWindow(slot, 1, 4);
}
  
function tick(bot: mineflayer.Bot, checkNotEmptySlots = true) {
  if (bot.currentWindow !== null) {
    bot.baseWarn(pluginName, 'Player has open a window. Skip drop.');
    return;
  }

  const notEmptySlots = getNotEmptySlot(bot);
  if (
    checkNotEmptySlots && 
    notEmptySlots.length < bot.getConfig(pluginName, 'triggerMinNotEmptySlots')
  ) {
    return;
  }

  const needDropSlots: number[] = [];
  const dropMode = bot.getConfig(pluginName, 'dropMode');
  const checkItems = bot.getConfig(pluginName, 'items');
  const ignoreSlots = bot.getConfig(pluginName, 'ignoreSlots');
  for (const i of notEmptySlots) {
    if (ignoreSlots.includes(i)) {
      continue;
    }
    const item = bot.inventory.slots[i];
    if (!item) continue;

    if ((dropMode === 'whitelist' && !isMatch(item, checkItems)) ||
      (dropMode === 'blacklist' && isMatch(item, checkItems))) {
      needDropSlots.push(i);
    }
  }
  if (needDropSlots.length === 0) {
    return;
  }
  handleDrop(bot, needDropSlots);
}

function registCmd(bot: mineflayer.Bot) {
  const CommandManager = bot.getCommandManager();
  bot.registerCmd(CommandManager.command([pluginName, 'ad'])
    .execute(showHelp)
    .then(CommandManager.command('on').execute(bot => bot.enableAutoDrop()))
    .then(CommandManager.command('off').execute(bot => bot.disableAutoDrop()))
    .then(CommandManager.command('test').execute(bot => tick(bot, false)))
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
          const newIgnoreSlots = [...new Set([...bot.getConfig(pluginName, 'ignoreSlots'), ...slots])];
          bot.setConfig(pluginName, 'ignoreSlots', newIgnoreSlots);
        }))
      )
      .then(CommandManager.command('set')
        .then(CommandManager.value('<slot1>,<slot2>,<slot3>...').execute((bot, value) => {
          const slots = CmdParser.parseArrayInt(value);
          if (!slots.length) {
            bot.baseError(pluginName, 'Slot value is empty.');
            return;
          }
          bot.baseInfo(pluginName, `Ignore set to ${slots}`);
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
          bot.baseInfo(pluginName, `Interval set to ${interval}`);
          bot.setConfig(pluginName, 'triggerInterval', interval);
      }))
      .then(CommandManager.argument(['-m', '--mode']).execute((bot, value) => {
        if (!['whitelist', 'blacklist'].includes(value)) {
          bot.baseError(pluginName, `Mode ${value} is invalid.`);
          return;
        }
        bot.baseInfo(pluginName, `Mode set to ${value}`);
        bot.setConfig(pluginName, 'dropMode', value);
      }))
      .then(CommandManager.argument(['-d', '--direction']).execute((bot, value) => {
        if (!['north', 'south', 'east', 'west', 'up', 'down', 'looking'].includes(value)) {
          bot.baseError(pluginName, `Direction ${value} is invalid.`);
          return;
        }

        bot.baseInfo(pluginName, `Direction set to ${value}`);
        bot.setConfig(pluginName, 'dropDirection', value);
      }))
      .then(CommandManager.argument(['-r', '--rotation']).execute(async (bot, value) => {
        const matcher = value.match(/^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/);
        if (!matcher) {
          bot.baseError(pluginName, `Rotation value is invalid.`);
          return;
        }
        const rotation = {
          yaw: parseFloat(matcher[1]!),
          pitch: parseFloat(matcher[2]!),
        }
        bot.setConfig(pluginName, 'dropRotation', rotation);
        bot.baseInfo(pluginName, `Rotation set to ${JSON.stringify(rotation)}`);
      }))
      .then(CommandManager.argument('--dropWay')
        .execute((bot, way) => {
          if (!['direction', 'rotation'].includes(way)) {
            bot.baseError(pluginName, `DropWay ${way} is invalid.`);
            return;
          }
          bot.baseInfo(pluginName, `DropWay set to ${way}`);
          bot.setConfig(pluginName, 'useDropRotation', way === 'rotation');
        }))
    )
    .then(CommandManager.command('config')
      .then(CommandManager.command('show')
        .then(CommandManager.value('<property>')
          .suggests(Object.keys(defaultConfig))
          .execute((bot, property) => {
            bot.baseInfo(
              pluginName, 
              `${property}: ${JSON.stringify(bot.getConfig(pluginName, property), null, 2)}`);
          }))
      )
      .then(CommandManager.command('reload').execute(async (bot) => {
        bot.loadConfig(pluginName, defaultConfig);
        bot.onAutoDropConfigReload();
        bot.baseInfo(pluginName, 'Config reloaded.');
      }))
    )
  )
}

function updateTriggerItemId(bot: mineflayer.Bot) {
  const triggerItemId = bot.getConfig(pluginName, 'triggerItemId');
  if (triggerItemId === '*') {
    bot._triggerItemId = -1;
    return;
  }
  const itemId = bot.registry.itemsByName[triggerItemId]?.id;
  if (!itemId) {
    throw new Error(`Item ${triggerItemId} not found.`);
  }
  bot._triggerItemId = itemId;
}

const AUTO_DROP_TICK = 'autoDropTick';

export default async function inject(bot: mineflayer.Bot) {
  await waitPluginLoads(bot, ['makeConfig', 'logger', 'command', 'task', 'action']);
  
  bot.loadConfig(pluginName, defaultConfig);
  bot._autodrop_isTurnBack = true;
  bot.tryDrop = () => tick(bot);
  bot.isItemMatch = (item: prisItem.Item) => isItemMatch(bot, item);
  bot._triggerItemId = 0;

  updateTriggerItemId(bot);

  bot.enableAutoDrop = () => {
    cleanup();
    bot.baseInfo(pluginName, 'Autodrop enabled.');

    if (bot.getConfig(pluginName, 'triggerByTime')) {
      bot.createTimeTask(AUTO_DROP_TICK, tick, bot.getConfig(pluginName, 'triggerInterval'));
    }
    
    if (bot.getConfig(pluginName, 'triggerByItem')) {
      bot.on('playerCollect', onPlayerCollectItem);
    }
  }

  bot.disableAutoDrop = () => {
    cleanup();
    bot.baseInfo(pluginName, 'Autodrop disabled.');
  }

  function cleanup() {
    bot._autodrop_isTurnBack = true;
    bot.off('playerCollect', onPlayerCollectItem);
    bot.removeTimeTask(AUTO_DROP_TICK);
  }

  function onPlayerCollectItem(player: prismEntity.Entity, item: prismEntity.Entity) {
    if (player.username !== bot.username) return;
    if (
      bot._triggerItemId !== -1 &&

      // @ts-ignore  // https://minecraft.wiki/w/Java_Edition_protocol/Slot_data
      bot._triggerItemId !== item.metadata[8]?.itemId
    ) {
      return;
    }

    bot.tryDrop();
    if (bot.hasTimeTask(AUTO_DROP_TICK)) {
      bot.restartTimeTask(AUTO_DROP_TICK);
    }
  }

  bot.onAutoDropConfigReload = () => {
    updateTriggerItemId(bot);
    if (bot.hasTimeTask(AUTO_DROP_TICK)) {
      bot.updateTimeTask(AUTO_DROP_TICK, bot.getConfig(pluginName, 'triggerInterval'));
    }
    bot.off('playerCollect', onPlayerCollectItem);
    if (bot.getConfig(pluginName, 'triggerByItem')) {
      bot.on('playerCollect', onPlayerCollectItem);
    }

    const triggerByTime = bot.getConfig(pluginName, 'triggerByTime');
    if (
      triggerByTime &&
      !bot.hasTimeTask(AUTO_DROP_TICK)
    ) {
      bot.createTimeTask(AUTO_DROP_TICK, tick, bot.getConfig(pluginName, 'triggerInterval'));
    } else if (!triggerByTime) {
      bot.removeTimeTask(AUTO_DROP_TICK);
    }
  }

  bot.once('cleanup', cleanup);

  registCmd(bot);
  pluginReady(bot, pluginName);
}


declare module 'mineflayer' {
  interface Bot {
    _autodrop_isTurnBack: boolean;
    _triggerItemId: number;
    tryDrop(): void;
    enableAutoDrop(): void;
    disableAutoDrop(): void;
    onAutoDropConfigReload(): void;
    isItemMatch(item: prisItem.Item): boolean;
  }
}


interface Config {
  ignoreSlots: number[];
  useDropRotation: boolean;
  dropRotation: {
    yaw: number;
    pitch: number;
  };
  dropDirection: string;
  triggerInterval: number;
  dropMode: 'whitelist' | 'blacklist';
  triggerMinNotEmptySlots: number;
  triggerByTime: boolean;
  triggerByItem: boolean;
  triggerItemId: string;
  items: {
    enabled?: boolean;     // default true
    name?: string;         // string or regex pattern (e.g. '/^Golden Apple$/')
    id?: string;           // https://zh.minecraft.wiki/w/Java版数据值#物品
    durability?: number;   // default 0, -1 for full durability, -2 for none full durability
    enchants?: {           // https://zh.minecraft.wiki/w/Java版数据值#魔咒
      name: string;
      lvl: number;
    }[];
    minEntCounts?: number;
  }[];
}
