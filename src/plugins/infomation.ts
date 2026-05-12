import mineflayer from 'mineflayer';
import prisItem from 'prismarine-item';
import { pluginReady, waitPluginLoads } from '../utils/pluginWaiter.js';

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
  if (!bot.inventory.slots[slot]) {
    bot.baseInfo(pluginName, `Slot ${slot} is empty`);
    return;
  }
  if (raw) {
    showRawItemInfo(bot, bot.inventory.slots[slot]);
  } else {
    showItemInfo(bot, bot.inventory.slots[slot]);
  }
}


export default async function inject(bot: mineflayer.Bot) {
  await waitPluginLoads(bot, ['logger', 'command']);

  bot.showItem = (item: prisItem.Item) => showItemInfo(bot, item);
  bot.showHandItem = () => showHandItem(bot);
  bot.showRawItem = (item: prisItem.Item) => showRawItemInfo(bot, item);
  bot.showItemInSlot = (slot: number) => showItemInSlot(bot, slot);

  const CommandManager = bot.getCommandManager();
  bot.registerCmd(CommandManager.command('info')
    .then(CommandManager.command('item')
      .then(CommandManager.command('hand')
        .execute((bot, args) => {
          const raw = args !== undefined && args['-r'] !== undefined;
          showHandItem(bot, raw);
        })
        .then(CommandManager.argument(['-r', '--raw']))
      )
      .then(CommandManager.command('slot')
        .then(CommandManager.value('slot')
          .execute((bot, value) => {
            if (!value) {
              bot.baseError(pluginName, 'Slot is required');
              return;
            }
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
