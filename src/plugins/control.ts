import mineflayer from 'mineflayer'
import { Vec3 } from 'vec3';
import { type Block } from 'prismarine-block'
import ChatMessageLoader from "prismarine-chat";
import { waitPluginLoads } from '../utils/pluginWaiter.js';
import { putDownCarryItem } from '../utils/InventoryUtil.js';

const pluginName = 'control';

function openContainer(bot: mineflayer.Bot, position: Vec3) {
  const block = bot.blockAt(position);
  if (block === null) {
    bot.baseError(pluginName, `Container not found at ${position}`);
    return;
  }

  bot.openContainer(block);
}

function openNearstContainer(bot: mineflayer.Bot) {
  function matcher(block: Block) {
    const containerNameList = ['generic', 'chest', 'dispenser', 'ender_chest', 'shulker_box', 'hopper', 'container', 'dropper', 'trapped_chest', 'barrel', 'white_shulker_box', 'orange_shulker_box', 'magenta_shulker_box', 'light_blue_shulker_box', 'yellow_shulker_box', 'lime_shulker_box', 'pink_shulker_box', 'gray_shulker_box', 'light_gray_shulker_box', 'cyan_shulker_box', 'purple_shulker_box', 'blue_shulker_box', 'brown_shulker_box', 'green_shulker_box', 'red_shulker_box', 'black_shulker_box']
    return containerNameList.includes(block.name);
  }

  const container = bot.findBlock({ matching: matcher });
  if (container === null) {
    bot.baseError(pluginName, 'Container not found');
    return;
  }
  bot.openContainer(container);
}

function dropInventorySlot(bot: mineflayer.Bot, slot: number) {
  const window = bot.currentWindow ?? bot.inventory;
  const item = window.slots[slot];
  if (item) {
    const info = bot.showItemInfoInline(item, { count: true, durability: true, enchant: true });
    bot.baseInfo(pluginName, `Drop ${info}`)
  } else {
    bot.baseError(pluginName, 'Slot is empty');
  }
  bot.clickWindow(slot, 1, 4)
}

function dropContainerSlot(bot: mineflayer.Bot, slot: number) {
  if (bot.currentWindow === null) {
    bot.baseError(pluginName, 'Container not opened');
    return;
  }
  const item = bot.currentWindow.slots[slot];
  if (item) {
    const info = bot.showItemInfoInline(item, { count: true, durability: true, enchant: true });
    bot.baseInfo(pluginName, `Drop ${info}`)
  } else {
    bot.baseError(pluginName, 'Slot is empty');
  }
  bot.clickWindow(slot, 1, 4)
}

function closeContainer(bot: mineflayer.Bot, windowId?: number) {
  if (windowId !== undefined) {
    bot._client.write('close_window', { windowId });
    bot.baseInfo(pluginName, `Close window ${windowId}`);
    return;
  }

  if (bot.currentWindow !== null) {
    // @ts-ignore
    const title = ChatMessageLoader(bot.registry).fromNotch(bot.currentWindow.title).toAnsi();
    bot.baseInfo(pluginName, `Close current window ${title}`);
    bot.closeWindow(bot.currentWindow);
  }
}

function registerCmd(bot: mineflayer.Bot) {
  const CM = bot.getCommandManager();

  const dropCmd = CM.command('drop')
    .then(CM.command('slot')
      .then(CM.value('<Slot>')
        .execute((bot, slot) => {
          const slotNum = parseInt(slot);
          dropInventorySlot(bot, slotNum);
        })))
    .then(CM.command('hand')
      .execute(bot => {
        const window = bot.currentWindow ?? bot.inventory;
        dropInventorySlot(bot, window.inventoryEnd - (9 - bot.quickBarSlot));
      }))

  const openCmd = CM.command('open')
    .then(CM.command('container')
      .then(CM.command('nearst')
        .execute(openNearstContainer))
      .then(CM.command('at')
        .then(CM.value('<Position>')
          .execute((bot, position) => {
            const pattern = /^(-?\d+),\s*(-?\d+),\s*(-?\d+)$/;
            const match = pattern.exec(position);
            if (!match) {
              bot.baseError(pluginName, `Invalid position ${position}`);
              return;
            }
            const pos = new Vec3(
              parseInt(match[1]!), 
              parseInt(match[2]!), 
              parseInt(match[3]!)
            );
            openContainer(bot, pos);
          }))))
    .then(CM.command('block')
      .then(CM.value('<Position>')
        .execute((bot, position) => {
          const pattern = /^(-?\d+),\s*(-?\d+),\s*(-?\d+)$/;
          const match = position.match(pattern);
          if (!match) {
            bot.baseError(pluginName, `Invalid position ${position}`);
            return;
          }
          const pos = new Vec3(
            parseInt(match[1]!), 
            parseInt(match[2]!), 
            parseInt(match[3]!)
          );
          const block = bot.blockAt(pos);
          if (!block) {
            bot.baseError(pluginName, `Block not found at ${position}`);
            return;
          }
          bot.openBlock(block);
        }))
    );

    const quickBarCmd = CM.command('quickBar')
      .then(CM.value('<Slot>')
        .execute((bot, slot) => {
          const slotNum = parseInt(slot);
          if (slotNum < 0 || slotNum > 8) {
            bot.baseError(pluginName, 'Invalid slot');
            return;
          }
          bot.setQuickBarSlot(slotNum);
        }));
    
    const moveSlot = CM.command('moveSlot')
      .then(CM.value('<slot1, slot2>')
        .execute((bot, slot) => {
          const match = slot.match(/(\d{1,2}),\s*(\d{1,2})/);
          if (!match) {
            bot.baseError(pluginName, 'Invalid slot format');
            return;
          }
          const sourceSlot = parseInt(match[1]!);
          const destSlot = parseInt(match[2]!);
          if (sourceSlot === destSlot) {
            bot.baseError(pluginName, 'Same slot');
            return;
          }
          bot.moveSlotItem(sourceSlot, destSlot);
          putDownCarryItem(bot);
        }))
    

  bot.registerCmd(CM.command(['control', 'c'])
    .then(moveSlot)
    .then(dropCmd)
    .then(openCmd)
    .then(quickBarCmd)
    .then(CM.command('close')
      .execute((bot) => closeContainer(bot))
      .then(CM.value('<WindowId>')
        .execute((bot, windowId) => closeContainer(bot, parseInt(windowId)))))
  );
}


export default async function inject(bot: mineflayer.Bot) {
  await waitPluginLoads(bot, ['command', 'logger']);
  registerCmd(bot);

  bot.closeContainer = (windowId?: number) => closeContainer(bot, windowId);
}

declare module 'mineflayer' {
  interface Bot {
    closeContainer: (windowId?: number) => void;
  }
}
