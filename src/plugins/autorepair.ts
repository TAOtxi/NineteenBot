import mineflayer from 'mineflayer';
import prisItem from 'prismarine-item';
import { Vec3 } from 'vec3';
import { type Window } from 'prismarine-windows'
import { pluginReady, waitPluginLoads } from '../utils/pluginWaiter.js';
import { moveSlot, putDownCarryItem } from '../utils/InventoryUtil.js';

const defaultConfig: Config = {
  minExpRequired: 5,
  mendingBookContainerPos: {
    x: 0,
    y: 0,
    z: 0
  },
  canGetEquipmentFromContainer: false,
  equipmentContainerPos: {
    x: 0,
    y: 0,
    z: 0
  }
};

const pluginName = 'autorepair';
const INTERACT_RADIUS = 4.0;
const AUTO_REPAIR_COMBINE = 'autoRepairCombine';
const AUTO_REPAIR_TICK = 'autoRepairTick';
const AUTO_REPAIR_TIME_OUT_CHECK = 'autoRepairTimeOutCheck';
const AUTO_REPAIR_OPEN_TIME_OUT = 'autoRepairOpenTimeOut';
const AUTO_REPAIR_TIME_OUT = 20 * 15;
const AUTO_REPAIR_CHECK_INTERVAL = 20 * 10;

const containerBlocks = [
  'hopper',
  'dropper',
  'dispenser',
  'crafter',
  /_?chest$/,
  /_?shulker_box$/
]

function shouldEnchantMendingBook(item: prisItem.Item) {
  if (item.maxDurability === undefined || item.durabilityUsed === 0) return false;
  if (item.stackSize !== 1) return false;

  if (item.enchants.some(enchant => enchant.name === 'mending')) return false;

  return /^netherite_/.test(item.name);
}

function isNetheriteEquipment(item: prisItem.Item) {
  if (item.maxDurability === undefined) return false;
  if (item.stackSize !== 1) return false;

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

function getEquipmentCount(bot: mineflayer.Bot) {
  const l = bot.inventory.inventoryStart;
  const r = bot.inventory.inventoryEnd;

  let equipmentCount = 0;
  for (let i = l; i < r; i++) {
    const item = bot.inventory.slots[i];
    if (item && isNetheriteEquipment(item)) {
      equipmentCount++;
    }
  }
  return equipmentCount;
}

async function getItemFromContainer(
  bot: mineflayer.Bot, 
  pos: Vec3, 
  test: (item: prisItem.Item) => boolean, 
  count: number
) {
  if (count <= 0) return;

  if (pos.distanceSquared(bot.entity.position) > INTERACT_RADIUS * INTERACT_RADIUS) {
    return;
  }

  const block = bot.blockAt(pos);
  if (!block || !isContainerBlock(bot, block.position)) {
    bot.stopAutoRepair();
    bot.baseError(pluginName, `Position ${pos.toString()} is not a container block. Stop autorepair.`);
    return;
  }

  bot.createOnceTimeTask(AUTO_REPAIR_OPEN_TIME_OUT, () => {
    resetState(bot);
  }, AUTO_REPAIR_TIME_OUT);
  const window = await bot.openContainer(block);
  bot.removeTimeTask(AUTO_REPAIR_OPEN_TIME_OUT);

  const slotRange = getContainerSlotRange(window);
  if (!slotRange) {
    bot.stopAutoRepair();
    bot.baseError(pluginName, `Container type ${window.type} is not supported. Stop autorepair.`);
    return;
  }

  const beforeCount = count;
  for (let i = slotRange.startSlot; i <= slotRange.endSlot; i++) {
    const item = window.slots[i];
    if (!item) continue;
    if (test(item)) {
      count--;

      if (window.selectedItem) {
        await putDownCarryItem(bot);
      }

      await moveSlot(bot, i);
    }
    if (count <= 0) break;
  }
  bot.closeWindow(window);
  if (count === beforeCount) {
    bot.stopAutoRepair();
    bot.baseError(pluginName, `Container in ${pos.toString()} does not contain any match item. Stop autorepair.`);
  }
}

async function tick(bot: mineflayer.Bot) {
  if (bot._isGettingEquipment) return;
  if (bot._isGettingMendingBook) return;
  if (bot._isRepairing) return;

  const level = bot.experience.level;
  if (level < bot.getConfig(pluginName, 'minExpRequired')) {
    return;
  }

  if (bot.currentWindow !== null) {
    bot.closeWindow(bot.currentWindow);
  }

  const equipmentCount = getEquipmentCount(bot);
  let emptySlotCount = bot.inventory.emptySlotCount();

  const canGetEquipmentFromContainer = bot.getConfig(pluginName, 'canGetEquipmentFromContainer') as Config['canGetEquipmentFromContainer'];
  if (equipmentCount === 0 && canGetEquipmentFromContainer) {
    const pos = bot.getConfig(pluginName, 'equipmentContainerPos') as Config['equipmentContainerPos'];
    const vec3 = new Vec3(pos.x, pos.y, pos.z);

    bot._isGettingEquipment = true;
    getItemFromContainer(
      bot, 
      vec3, 
      shouldEnchantMendingBook, 
      Math.min(25, emptySlotCount)
    ).catch(e => {
      bot.baseError(pluginName, `Get equipment failed: ${e.message}`);
      resetState(bot);
    });
    bot._isGettingEquipment = false;
    return;
  }

  const l = bot.inventory.inventoryStart;
  const r = bot.inventory.inventoryEnd;

  let repairCount = 0;
  let mendingBookCount = 0;
  for (let i = l; i < r; i++) {
    const item = bot.inventory.slots[i];
    if (!item) continue;
    if (shouldEnchantMendingBook(item)) {
      repairCount++;
    }
    if (isMendingBook(item)) {
      mendingBookCount++;
    }
  }
  if (repairCount === 0) return;

  if (mendingBookCount === 0) {
    emptySlotCount = bot.inventory.emptySlotCount();
    const pos = bot.getConfig(pluginName, 'mendingBookContainerPos') as Config['mendingBookContainerPos'];
    const vec3 = new Vec3(pos.x, pos.y, pos.z);

    bot._isGettingMendingBook = true;
    getItemFromContainer(
      bot, 
      vec3,
      isMendingBook,
      Math.min(repairCount, emptySlotCount, Math.floor(level / 2))
    ).catch(e => {
      bot.baseError(pluginName, `Get mending book failed: ${e.message}`);
      resetState(bot);
    });
    bot._isGettingMendingBook = false;
    return;
  }

  function isAnvilBlock(pos: Vec3) {
    const block = bot.blockAt(pos);
    return block && /anvil$/.test(block.name);
  }

  if (bot._anvilBlockPos === null || !isAnvilBlock(bot._anvilBlockPos)) {
    const anvilBlock = bot.findNearestAnvilBlock();
    if (anvilBlock === null) {
      return;
    }
    bot._anvilBlockPos = anvilBlock.position;
  }

  tryRepair(bot).catch(e => {
    bot.baseError(pluginName, `Repair failed: ${e.message}`);
    resetState(bot);
    // bot.stopAutoRepair();
  });
}

async function resetState(bot: mineflayer.Bot) {
  bot._isGettingEquipment = false;
  bot._isRepairing = false;
  bot._isGettingMendingBook = false;
  bot._isCombining = false;
  bot.removeTimeTask(AUTO_REPAIR_COMBINE);
  bot.removeTimeTask(AUTO_REPAIR_OPEN_TIME_OUT);
  bot.removeTimeTask(AUTO_REPAIR_TIME_OUT_CHECK);

  const window = bot.currentWindow ?? bot.inventory;
  if (window.selectedItem) {
    await putDownCarryItem(bot);
  }

  if (bot.currentWindow !== null) {
    bot.closeWindow(bot.currentWindow);
  }
}


async function tryRepair(bot: mineflayer.Bot) {
  bot._isRepairing = true;
  if (bot.hasTimeTask(AUTO_REPAIR_TIME_OUT_CHECK)) {
    bot.restartTimeTask(AUTO_REPAIR_TIME_OUT_CHECK);
  } else {
    bot.createOnceTimeTask(AUTO_REPAIR_TIME_OUT_CHECK, () => {
      bot.baseInfo(pluginName, 'Repair timeout. Reset state.');
      resetState(bot);
    }, AUTO_REPAIR_TIME_OUT);
  }

  if (bot.currentWindow?.type !== 'minecraft:anvil') {
    if (bot.currentWindow !== null) {
      resetState(bot);
      return;
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
  bot.restartTimeTask(AUTO_REPAIR_TIME_OUT_CHECK);
  bot.createTimeTask(AUTO_REPAIR_COMBINE, combineTask, 1, true);
}

function setCanGetEquipmentFromContainer(bot: mineflayer.Bot, flag: boolean) {
  bot.setConfig(pluginName, 'canGetEquipmentFromContainer', flag);
}

async function combineTask(bot: mineflayer.Bot) {
  if (bot._isCombining) return;
  bot._isCombining = true;
  const window = bot.currentWindow;
  if (window?.type !== 'minecraft:anvil') {
    resetState(bot);
    return;
  }

  let needToRepairItem = null;
  let mendingBookItem = null;

  if (window.slots[0] && shouldEnchantMendingBook(window.slots[0])) {
    needToRepairItem = window.slots[0];
  }
  if (window.slots[1] && isMendingBook(window.slots[1])) {
    mendingBookItem = window.slots[1];
  }

  for (let i = 3; i < 39; i++) {
    if (needToRepairItem && mendingBookItem) {
      break;
    }

    const item = window.slots[i];
    if (!item) continue;

    if (!needToRepairItem && shouldEnchantMendingBook(item)) {
      needToRepairItem = item;
    }
    
    if (!mendingBookItem && isMendingBook(item)) {
      mendingBookItem = item;
    }
  }

  if (!needToRepairItem || !mendingBookItem) {
    resetState(bot);
    return;
  }
  await bot.anvilCombine(needToRepairItem, mendingBookItem);
  bot._isCombining = false;
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
        bot.baseInfo(pluginName, `isCombining:          ${bot._isCombining}`);
      }))
    .then(CM.command('canGetEquipmentFromContainer')
      .then(CM.command('on')
        .execute(bot => setCanGetEquipmentFromContainer(bot, true)))
      .then(CM.command('off')
        .execute(bot => setCanGetEquipmentFromContainer(bot, false))))
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
  bot._isCombining = false;
  bot._isGettingEquipment = false;

  bot.startAutoRepair = () => {
    resetState(bot);
    bot.baseInfo(pluginName, 'Enable AutoRepair.');
    if (!bot.hasTimeTask(AUTO_REPAIR_TICK)) {
      bot.createTimeTask(AUTO_REPAIR_TICK, tick, AUTO_REPAIR_CHECK_INTERVAL, true);
    }
  }

  bot.stopAutoRepair = () => {
    resetState(bot);
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
    _isCombining: boolean;
    _isGettingEquipment: boolean;
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
  minExpRequired: number;
  mendingBookContainerPos: Pos;
  canGetEquipmentFromContainer: boolean;
  equipmentContainerPos: Pos;
}