import mineflayer, { type Anvil } from 'mineflayer';
import prisItem from 'prismarine-item';
import { Vec3 } from 'vec3';
import { type Window } from 'prismarine-windows'
import { pluginReady, waitPluginLoads } from '../utils/pluginWaiter.js';

const defaultConfig: Config = {
  enabled: false,
  minExpRequired: 5,
  mendingBookContainerPos: {
    x: 0,
    y: 0,
    z: 0
  }
};

const pluginName = 'autorepair';
const INTERACT_RADIUS = 4.5;
const AUTO_REPAIR_COMBINE = 'autoRepairCombine';
const AUTO_REPAIR_TICK = 'autoRepairTick';

const containerBlocks = [
  'hopper',
  'dropper',
  'dispenser',
  'crafter',
  /_?chest$/,
  /_?shulker_box$/
]

function findAnvilBlock(bot: mineflayer.Bot) {
  return bot.findBlock({
    maxDistance: INTERACT_RADIUS,
    matching: block => /_?anvil$/.test(block.name)
  });
}

function shouldEnchantMendingBook(bot: mineflayer.Bot, item: prisItem.Item) {
  if (item.maxDurability === undefined || item.durabilityUsed === 0) return false;
  if (item.stackSize !== 1) return false;

  if (item.enchants.some(enchant => enchant.name === 'mending')) return false;
  if (!bot.registry.itemsByName[item.name]?.enchantCategories?.includes('durability')) {
    return false;
  }

  return /^netherite_/.test(item.name);
}

function isContainerBlock(bot: mineflayer.Bot, pos: Vec3) {
  const block = bot.blockAt(pos);
  if (!block) {
    return false;
  }
  for (const p of containerBlocks) {
    if (typeof p === 'string' && p === block.name) {
      return true;
    }
    if (p instanceof RegExp && p.test(block.name)) {
      return true;
    }
  }
  return false;
}

function isMendingBook(item: prisItem.Item) {
  return item.name === 'enchanted_book' && item.enchants.some(enchant => enchant.name === 'mending');
}

function getContainerSlotRange(window: Window): { startSlot: number, endSlot: number } | null {
  const containerMap: Record<string, number[]> = {
    'minecraft:inventory': [9, 44],
    'minecraft:generic_9x3': [0, 26],
    'minecraft:shulker_box': [0, 26],
    'minecraft:generic_9x6': [0, 53],
    'minecraft:crafter_3x3': [1, 9],
    'minecraft:generic_3x3': [0, 8],
    'minecraft:hopper': [0, 4],
  }

  // @ts-ignore
  const range = containerMap[window.type];
  if (range) {
    return { startSlot: range[0]!, endSlot: range[1]! };
  }
  return null;
}

async function tryToGetMendingBookFromContainer(bot: mineflayer.Bot, count: number) {
  const pos = bot.getConfig(pluginName, 'mendingBookContainerPos') as Config['mendingBookContainerPos'];
  
  const vec3 = new Vec3(pos.x, pos.y, pos.z);
  if (vec3.distanceSquared(bot.entity.position) > INTERACT_RADIUS * INTERACT_RADIUS) {
    return;
  }

  const block = bot.blockAt(vec3);

  if (!block || !isContainerBlock(bot, block.position)) {
    bot.stopAutoRepair();
    bot.baseError(pluginName, `Position ${vec3.toString()} is not a container block. Stop autorepair.`);
    return;
  }

  bot._isGettingMendingBook = true;
  const window = await bot.openContainer(block);
  const slotRange = getContainerSlotRange(window);
  if (!slotRange) {
    bot._isGettingMendingBook = false;
    bot.stopAutoRepair();
    bot.baseError(pluginName, `Container type ${window.type} is not supported. Stop autorepair.`);
    return;
  }

  for (let i = slotRange.startSlot; i <= slotRange.endSlot; i++) {
    const item = window.slots[i];
    if (!item) continue;
    if (isMendingBook(item)) {
      count--;
      bot.clickWindow(i, 0, 1);
    }
    if (count <= 0) break;
  }
  bot._isGettingMendingBook = false;
  bot.closeWindow(window);
}


function tick(bot: mineflayer.Bot) {
  if (bot._isGettingMendingBook) return;
  if (bot._isRepairing) return;

  if (bot.experience.level < bot.getConfig(pluginName, 'minExpRequired')) {
    return;
  }

  const l = bot.inventory.inventoryStart;
  const r = bot.inventory.inventoryEnd;
  
  let repairCount = 0;
  let mendingBookCount = 0;
  for (let i = l; i < r; i++) {
    const item = bot.inventory.slots[i];
    if (!item) continue;
    if (shouldEnchantMendingBook(bot, item)) {
      repairCount++;
    }
    if (isMendingBook(item)) {
      mendingBookCount++;
    }
  }
  if (repairCount === 0) return;

  if (repairCount - mendingBookCount > 0) {
    tryToGetMendingBookFromContainer(bot, repairCount - mendingBookCount);
    return;
  }

  function isAnvilBlock(pos: Vec3) {
    const block = bot.blockAt(pos);
    return block !== null && /^(?:chipped_|damaged_)?anvil$/.test(block.name);
  }

  if (bot._anvilBlockPos === null || !isAnvilBlock(bot._anvilBlockPos)) {
    const anvilBlock = findAnvilBlock(bot);
    if (anvilBlock === null) {
      return;
    }
    bot._anvilBlockPos = anvilBlock.position;
  }

  bot._isRepairing = true;
  tryRepair(bot).catch(e => {
    bot.baseError(pluginName, `Repair failed: ${e.message}`);
  });
}


async function tryRepair(bot: mineflayer.Bot) {
  if (bot.currentWindow?.type !== 'minecraft:anvil') {
    if (bot.currentWindow !== null) {
      bot.closeWindow(bot.currentWindow);
    }

    if (bot._anvilBlockPos === null) {
      throw new Error('Anvil block pos is null.');
    }

    const anvilBlock = bot.blockAt(bot._anvilBlockPos);
    if (!anvilBlock) {
      throw new Error('Something went wrong. Anvil block is null.');
    }
    const anvilWindow = await bot.openAnvil(anvilBlock);
    if (anvilWindow.type !== 'minecraft:anvil') {
      throw new Error('Current window is not anvil window.');
    }
  }
  bot.createTimeTask(AUTO_REPAIR_COMBINE, combineTask, 1);
}

async function combineTask(bot: mineflayer.Bot) {
  if (bot.currentWindow?.type !== 'minecraft:anvil') {
    bot.removeTimeTask(AUTO_REPAIR_COMBINE);
    bot._isRepairing = false;
    return;
  }
  const anvilWindow = bot.currentWindow as Anvil;

  let needToRepairItem = null;
  let mendingBookItem = null;

  for (let i = 3; i < 39; i++) {
    const item = anvilWindow.slots[i];
    if (!item) continue;
    if (!needToRepairItem && shouldEnchantMendingBook(bot, item)) {
      needToRepairItem = item;
    }
    if (!mendingBookItem && isMendingBook(item)) {
      mendingBookItem = item;
    }
    if (needToRepairItem && mendingBookItem) {
      break;
    }
  }
  if (!needToRepairItem || !mendingBookItem) {
    bot.closeWindow(anvilWindow);
    bot.removeTimeTask(AUTO_REPAIR_COMBINE);
    bot._isRepairing = false;
    return;
  }
  await anvilWindow.combine(needToRepairItem, mendingBookItem);
  bot._isRepairing = false;
}

function registCmd(bot: mineflayer.Bot) {
  const CM = bot.getCommandManager();
  bot.registerCmd(CM.command([pluginName, 'repair'])
    .then(CM.command('on')
      .execute(bot => bot.startAutoRepair()))
    .then(CM.command('off')
      .execute(bot => bot.stopAutoRepair()))
    .then(CM.command('state')
      .execute(bot => {
        bot.baseInfo(pluginName, `isGettingMendingBook: ${bot._isGettingMendingBook}`);
        bot.baseInfo(pluginName, `isRepairing:          ${bot._isRepairing}`);
      }))
    .then(CM.command('mendingBookPos')
      .then(CM.value('<x, y, z>')
        .execute((bot, pos) => {
          const match = pos.match(/(-?\d+),\s*(-?\d+),\s*(-?\d+)/);
          if (!match) {
            bot.baseError(pluginName, 'Invalid position format');
            return;
          }
          const x = parseInt(match[1]!);
          const y = parseInt(match[2]!);
          const z = parseInt(match[3]!);
          bot.setConfig(pluginName, 'mendingBookContainerPos', { x, y, z });
          bot.baseInfo(pluginName, `Set mending book container pos to <${x}, ${y}, ${z}>`);
        })))
  );
}

export default async function inject(bot: mineflayer.Bot) {
  await waitPluginLoads(bot, ['makeConfig', 'logger', 'command', 'task']);
  bot.loadConfig(pluginName, defaultConfig);
  bot._anvilBlockPos = null;
  bot._isGettingMendingBook = false;
  bot._isRepairing = false;

  bot.startAutoRepair = () => {
    bot._isRepairing = false;
    bot._isGettingMendingBook = false;
    bot.baseInfo(pluginName, 'Enable AutoRepair.');
    if (!bot.hasTimeTask(AUTO_REPAIR_TICK)) {
      bot.createTimeTask(AUTO_REPAIR_TICK, tick, 20);
    }
  }

  bot.stopAutoRepair = () => {
    if (bot.currentWindow?.type === 'minecraft:anvil') {
      bot.closeWindow(bot.currentWindow);
    } else if (
      bot._isGettingMendingBook && 
      (bot.currentWindow?.type === 'minecraft:generic_9x3' || 
        bot.currentWindow?.type === 'minecraft:generic_9x6')
      ) {
        bot.closeWindow(bot.currentWindow);
    }

    bot._isRepairing = false;
    bot._isGettingMendingBook = false;
    bot.removeTimeTask(AUTO_REPAIR_TICK);
  }

  function onCleanup() {
    bot.stopAutoRepair();
  }

  registCmd(bot);
  bot.once('cleanup', onCleanup);

  pluginReady(bot, pluginName);
}

declare module 'mineflayer' {
  interface Bot {
    _anvilBlockPos: Vec3 | null;
    _isGettingMendingBook: boolean;
    _isRepairing: boolean;
    startAutoRepair: () => void;
    stopAutoRepair:  () => void;
  }
}

type Pos = {
  x: number;
  y: number;
  z: number;
}

interface Config {
  enabled: boolean;
  minExpRequired: number;
  mendingBookContainerPos: Pos;
}