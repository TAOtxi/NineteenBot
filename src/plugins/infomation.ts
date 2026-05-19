import mineflayer from 'mineflayer';
import prisItem from 'prismarine-item';
import { pluginReady, waitPluginLoads } from '../utils/pluginWaiter.js';
import TranslateUtil from '../utils/TranslateUtil.js';

const pluginName = 'infomation';

function showRawItemInfo(bot: mineflayer.Bot, item: prisItem.Item) {
  bot.withoutLogTitle().baseInfo(pluginName, JSON.stringify(item, null, 2));
}

function showItemInfo(bot: mineflayer.Bot, item: prisItem.Item) {
  const output = `
  displayName: ${item.displayName}
  name: ${item.name}
  customName: ${item.customName}
  count: ${item.count}
  slot: ${item.slot}
  durabilityUsed: ${item.durabilityUsed}
  maxDurability: ${item.maxDurability}
  enchants: ${JSON.stringify(item.enchants)}
  `
  bot.withoutLogTitle().baseInfo(pluginName, output);
}

function showHandItem(bot: mineflayer.Bot, raw: boolean = false) {
  if (!bot.heldItem) {
    bot.baseInfo(pluginName, 'Hand is empty');
    return;
  }
  if (raw) {
    showRawItemInfo(bot, bot.heldItem);
  } else {
    showItemInfo(bot, bot.heldItem);
  }
}

function showItemInSlot(bot: mineflayer.Bot, slot: number, raw: boolean = false) {
  if (slot < bot.inventory.inventoryStart ||
      slot >= bot.inventory.inventoryEnd
  ) {
    bot.baseError(pluginName, `Slot ${slot} is out of range`);
    return;
  }
  const item = bot.inventory.slots[slot];
  if (!item) {
    bot.baseInfo(pluginName, `Slot ${slot} is empty`);
    return;
  }
  if (raw) {
    showRawItemInfo(bot, item);
  } else {
    showItemInfo(bot, item);
  }
}

function getItemName(item: prisItem.Item) {
  return item.customName ?? 
        TranslateUtil.item(item.name) ?? 
        item.displayName ?? 
        item.name;
}

function getEnchantList(item: prisItem.Item) {
  let info = '';
  for (const enchant of item.enchants) {
    info += `${TranslateUtil.enchant(enchant.name) ?? enchant.name}${enchant.lvl}, `;
  }
  return info.slice(0, -2);
}

function padZero(num: number, length: number = 2) {
  return num.toString().padStart(length, '0');
}

function showInventory(bot: mineflayer.Bot, args: Record<string, string>) {
  const l = bot.inventory.inventoryStart;
  const r = bot.inventory.inventoryEnd;
  for (let i = l; i < r; i++) {
    const item = bot.inventory.slots[i];
    if (!item) continue;
    
    let info = `${padZero(i)}: ${getItemName(item)}`;
    
    if (args['-d'] !== undefined && item.maxDurability) {
      info += `\t耐久: ${item.maxDurability - item.durabilityUsed}/${item.maxDurability}`;
    }
    if (args['-c'] !== undefined && item.stackSize !== 1) {
      info += `\t数量: ${item.count}/${item.stackSize}`;
    }
    if (args['-e'] !== undefined && item.enchants.length > 0) {
      info += `\t附魔: [${getEnchantList(item)}]`;
    }

    bot.withoutLogTitle().baseInfo(pluginName, info);
  }
}


function registCmd(bot: mineflayer.Bot) {
  const CommandManager = bot.getCommandManager();
  bot.registerCmd(CommandManager.command('info')
    .then(CommandManager.command(['inv', 'inventory'])
      .execute((bot, args) => showInventory(bot, args))
      .then(CommandManager.argument(['-e', '--enchant']))
      .then(CommandManager.argument(['-d', '--durability']))
      .then(CommandManager.argument(['-c', '--count']))
    )
    .then(CommandManager.command('item')
      .then(CommandManager.command('hand')
        .execute((bot, args) => {
          const raw = args !== undefined && args['-r'] !== undefined;
          showHandItem(bot, raw);
        })
        .then(CommandManager.argument(['-r', '--raw']))
      )
      .then(CommandManager.command('slot')
        .then(CommandManager.value('<slot>')
          .execute((bot, value) => {
            bot.showItemInSlot(parseInt(value), true);
          })))
    )
    .then(CommandManager.command(['e', 'entity'])
      .then(CommandManager.argument('--keys')
        .execute(bot => {
          bot.baseInfo(pluginName, Object.keys(bot.entities).join(', '));
        }))
    )
  );
}


export default async function inject(bot: mineflayer.Bot) {
  await waitPluginLoads(bot, ['logger', 'command']);

  bot.showItem = (item: prisItem.Item) => showItemInfo(bot, item);
  bot.showHandItem = () => showHandItem(bot);
  bot.showRawItem = (item: prisItem.Item) => showRawItemInfo(bot, item);
  bot.showItemInSlot = (slot: number) => showItemInSlot(bot, slot, true);

  registCmd(bot);

  pluginReady(bot, pluginName);
}

declare module 'mineflayer' {
  interface Bot {
    showItem: (item: prisItem.Item) => void;
    showHandItem: (raw?: boolean) => void;
    showRawItem: (item: prisItem.Item) => void;
    showItemInSlot: (slot: number, raw?: boolean) => void;
  }
}
