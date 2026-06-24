import mineflayer from 'mineflayer';
import { type Window } from 'prismarine-windows'
import prisItem from 'prismarine-item';
import { once } from './PromiseUtil.js';


async function putDownCarryItem(bot: mineflayer.Bot) {
  const window = bot.currentWindow ?? bot.inventory;
  const startSlot = window.inventoryStart;
  const endSlot = window.inventoryEnd;

  while (window.selectedItem) {
    const emptySlot = window.firstEmptySlotRange(startSlot, endSlot);
    if (emptySlot === null) {
      // drop
      await bot.clickWindow(-999, 0, 0);
    } else {
      await bot.clickWindow(emptySlot, 0, 0);
    }
  }
}

function waitForSlotUpdate<T>(window: Window<T>, slot: number) {
  return once(window, `updateSlot:${slot}`);
}

async function moveSlot(bot: mineflayer.Bot, srcSlot: number, dstSlot?: number) {
  if (srcSlot === dstSlot) return;

  const window = bot.currentWindow ?? bot.inventory;

  if (window.selectedItem) {
    await putDownCarryItem(bot);
  }

  await bot.clickWindow(srcSlot, 0, 0);

  if (dstSlot === undefined) {
    const emptySlot = window.firstEmptyInventorySlot();
    if (emptySlot === null) {
      // drop
      await bot.clickWindow(-999, 0, 0);
      return;
    }
    
    dstSlot = emptySlot;
  }

  await bot.clickWindow(dstSlot, 0, 0);

  // if (window.selectedItem) {
  //   await putDownCarryItem(bot);
  // }
}

type predicate = (item: prisItem.Item | null | undefined) => boolean;
function getItemsInRange(window: Window, pred: predicate, startSlot?: number, endSlot?: number) {
  if (startSlot === undefined) startSlot = 0;
  if (endSlot === undefined) endSlot = window.inventoryEnd;
  
  const items: prisItem.Item[] = [];
  for (let slot = startSlot; slot < endSlot; slot++) {
    const item = window.slots[slot];
    if (pred(item)) {
      items.push(item as prisItem.Item);
    }
  }
  return items;
}

function getInventoryEmptySlotCount(window: Window) {
  return getEmptySlotCountInRange(window, window.inventoryStart, window.inventoryEnd);
}

function getContainerEmptySlotCount(window: Window) {
  return getEmptySlotCountInRange(window, 0, window.inventoryStart);
}

function getEmptySlotCountInRange(window: Window, startSlot?: number, endSlot?: number) {
  if (startSlot === undefined) startSlot = 0;
  if (endSlot === undefined) endSlot = window.inventoryEnd;
  
  let emptySlotCount = 0;
  for (let slot = startSlot; slot < endSlot; slot++) {
    if (!window.slots[slot]) {
      emptySlotCount++;
    }
  }
  return emptySlotCount;
}


export {
  putDownCarryItem,
  waitForSlotUpdate,
  moveSlot,
  getItemsInRange,
  getInventoryEmptySlotCount,
  getContainerEmptySlotCount,
  getEmptySlotCountInRange,
}