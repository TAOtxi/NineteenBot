import mineflayer from 'mineflayer'
import { Vec3 } from 'vec3';
import { type Block } from 'prismarine-block'
import ChatMessageLoader from "prismarine-chat";
import { waitPluginLoads } from '../utils/pluginWaiter.js';

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
  let offset = 0;
  let item;
  if (bot.currentWindow !== null) {
    offset += bot.currentWindow.inventoryStart - bot.inventory.inventoryStart;
    item = bot.currentWindow.slots[slot + offset];
  } else {
    item = bot.inventory.slots[slot];
  }
  if (item) {
    const info = bot.showItemInfoInline(item, { count: true, durability: true, enchant: true });
    bot.baseInfo(pluginName, `Drop ${info}`)
  } else {
    bot.baseError(pluginName, 'Slot is empty');
  }
  bot.clickWindow(slot + offset, 1, 4)
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
    .then(CM.command('inventory')
      .then(CM.value('<Slot>')
        .execute((bot, slot) => {
          const slotNum = parseInt(slot);
          dropInventorySlot(bot, slotNum);
        })))
    .then(CM.command('container')
      .then(CM.value('<Slot>')
        .execute((bot, slot) => {
          const slotNum = parseInt(slot);
          dropContainerSlot(bot, slotNum);
        })))

  const openCmd = CM.command('open')
    .then(CM.command('container')
      .then(CM.command('nearst')
        .execute(openNearstContainer))
      .then(CM.command('at')
        .then(CM.value('<Position>')
          .execute((bot, position) => {
            const arr = position.replaceAll(' ', '').split(',');
            if (!arr || arr.length !== 3) {
              bot.baseError(pluginName, 'Invalid position');
              return;
            }
            const pos = new Vec3(
              parseFloat(arr[0]!), 
              parseFloat(arr[1]!), 
              parseFloat(arr[2]!)
            );
            openContainer(bot, pos);
          })))
    )
    

  bot.registerCmd(CM.command(['control', 'c'])
    .then(dropCmd)
    .then(openCmd)
    .then(CM.command('close')
      .execute((bot) => closeContainer(bot))
      .then(CM.value('<WindowId>')
        .execute((bot, windowId) => closeContainer(bot, parseInt(windowId)))))
  )
}


export default async function inject(bot: mineflayer.Bot) {
  await waitPluginLoads(bot, ['command', 'logger']);
  registerCmd(bot);
}
