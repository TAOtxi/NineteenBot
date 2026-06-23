import mineflayer from 'mineflayer';
import prisItem from 'prismarine-item';
import { type Window } from 'prismarine-windows'
import { waitPluginLoads } from '../utils/pluginWaiter.js';
import assert from 'assert';
import { moveSlot, putDownCarryItem, waitForSlotUpdate } from '../utils/InventoryUtil.js';
import type { Block } from 'prismarine-block';

async function openNearstAnvil(bot: mineflayer.Bot) {
  if (bot.currentWindow && bot.currentWindow.type !== 'minecraft:anvil') {
    bot.closeWindow(bot.currentWindow);
  }
  
  let window: Window | null = null;
  if (bot.currentWindow?.type === 'minecraft:anvil') {
    window = bot.currentWindow;
  } else {
    const block = findNearstAnvilBlock(bot);
    
    if (!block) {
      bot.baseError(pluginName, 'No anvil found.');
      return null;
    }
    window = await bot.openBlock(block);
  }

  return window;
}

function findNearstAnvilBlock(bot: mineflayer.Bot) {
  return bot.findBlock({
    maxDistance: 4.5,
    matching: block => /_?anvil$/.test(block.name),
  })
}

function sendItemName(bot: mineflayer.Bot, name: string) {
  if (bot.supportFeature('useMCItemName')) {
    bot._client.writeChannel('MC|ItemName', name)
  } else {
    bot._client.write('name_item', { name })
  }
}

async function combine(bot: mineflayer.Bot, item1: prisItem.Item, item2: prisItem.Item, detail = true) {
  // if (bot.supportFeature('useMCItemName')) {
  //   bot._client.registerChannel('MC|ItemName', 'string')
  // }

  if (bot.currentWindow?.type !== 'minecraft:anvil') {
    throw new Error('Current window is not anvil window.');
  }

  // @ts-ignore
  const Item = prisItem(bot.registry);
  const combineCost = Item.anvil(item1, item2, bot.game.gameMode === 'creative');

  assert.ok(combineCost !== 0, 'Not a valid item pair.');
  assert.ok(combineCost.xpCost <= bot.experience.level, 'Not enough experience.');
  
  await moveSlot(bot, item1.slot, 0);
  // sendItemName(bot, '')
  // if (!bot.supportFeature('useMCItemName')) sendItemName(bot, '')
  await moveSlot(bot, item2.slot, 1);

  if (bot.currentWindow?.type !== 'minecraft:anvil') {
    bot.baseError(pluginName, 'Current window is not anvil window. Cancel combine.');
    return;
  }

  if (bot.currentWindow?.slots[2]) {
    if (bot.currentWindow.selectedItem) {
      await putDownCarryItem(bot);
    }

    await bot.clickWindow(2, 0, 0);
    await putDownCarryItem(bot);
  }

  await waitForSlotUpdate(bot.currentWindow!, 2);

  await bot.clickWindow(2, 0, 0);

  await putDownCarryItem(bot);
}

const pluginName = 'anvil';

export default async function inject(bot: mineflayer.Bot) {
  await waitPluginLoads(bot, ['logger']);
  bot.openNearstAnvil = () => openNearstAnvil(bot);
  bot.findNearestAnvilBlock = () => findNearstAnvilBlock(bot);
  bot.anvilCombine = (item1, item2) => combine(bot, item1, item2);
}


declare module 'mineflayer' {
  interface Bot {
    findNearestAnvilBlock: () => Block | null;
    openNearstAnvil: () => Promise<Window | null>;
    anvilCombine: (item1: prisItem.Item, item2: prisItem.Item) => Promise<void>;
  }
}