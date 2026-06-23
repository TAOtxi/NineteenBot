import mineflayer from 'mineflayer';
import prisItem from 'prismarine-item';
import prismEntity from 'prismarine-entity';
import ChatMessageLoader from "prismarine-chat";
import { pluginReady, waitPluginLoads } from '../utils/pluginWaiter.js';
import TranslateUtil from '../utils/TranslateUtil.js';

const pluginName = 'infomation';

function getAnsi(bot: mineflayer.Bot, message: string | Object) {
  if (typeof message === 'string') {
    return message;
  }
  // @ts-ignore
  const ChatMessageClass = ChatMessageLoader(bot.registry)
  // @ts-ignore
  return ChatMessageClass.fromNotch(message).toAnsi();
}

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
  const window = bot.currentWindow ?? bot.inventory;
  const item = window.slots[slot];
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

function getEntityIdentify(entity: prismEntity.Entity) {
  const name = entity.getCustomName()?.toAnsi() ?? 
              entity.username ?? 
              TranslateUtil.entity(entity.name || '') ?? 
              entity.displayName ?? 
              null;
  return `${name}.${entity.name} ${entity.position.toString()}`
}

function showEntityInfo(bot: mineflayer.Bot, entity: prismEntity.Entity, displayProperties: Array<string>) {
  if (displayProperties.length === 0) {
    displayProperties.push('health');
    displayProperties.push('yaw');
    displayProperties.push('pitch');
    displayProperties.push('velocity');
  }
  bot.withoutLogTitle().baseInfo(pluginName, getEntityIdentify(entity));
  for (const property of displayProperties) {
    if (!(property in entity)) {
      continue;
    }
    // @ts-ignore
    bot.withoutLogTitle().baseInfo(pluginName, `  ${property}: ${entity[property]}`);
  }
}

function getEntities(bot: mineflayer.Bot, condition: Record<string, string>) {
  const entities: prismEntity.Entity[] = [];
  const properties: Record<string, any> = {};
  for (const key of ['displayName', 'type', 'username', 'name']) {
    if (condition[`--${key}`] !== undefined) {
      properties[key] = condition[`--${key}`];
    }
  }

  for (const key of ['entityType']) {
    if (condition[`--${key}`] !== undefined) {
      properties[key] = Number(condition[`--${key}`]);
    }
  }

  const radius2 = condition['-d'] !== undefined ? Number(condition['-d']) * Number(condition['-d']) : null;
  if (Object.keys(properties).length === 0) {
    for (const entity of Object.values(bot.entities)) {
      if (radius2 === null ||
          entity.position.distanceSquared(bot.entity.position) <= radius2
      ) {
        entities.push(entity);
      }
    }
  } else {
    for (const entity of Object.values(bot.entities)) {
      let isMatch = Object.keys(properties).every(key => {
        if (!(key in entity)) {
          return true;  // 可能不存在
        }
        // @ts-ignore
        return entity[key] === properties[key];
      })
      if (!isMatch) continue;
  
      if (radius2 === null ||
          entity.position.distanceSquared(bot.entity.position) <= radius2
      ) {
        entities.push(entity);
      }
    }
  }
  entities.sort((a, b) => a.position.distanceSquared(bot.entity.position) - b.position.distanceSquared(bot.entity.position));

  const maxCount = condition['-c'] !== undefined ? Number(condition['-c']) : null;
  if (maxCount !== null && entities.length > maxCount) {
    entities.splice(maxCount);
  }
  return entities;
}

function showEntityAround(bot: mineflayer.Bot, properties: Record<string, string>) {
  const entities: prismEntity.Entity[] = getEntities(bot, properties);
  if (entities.length === 0) {
    bot.baseInfo(pluginName, 'No entity around');
    return;
  }
  bot.withoutLogTitle().baseInfo(pluginName, '');
  const displayProperties: Array<string> = properties['--display']?.replaceAll(' ', '')?.split(',') ?? [];
  for (const entity of entities) {
    if (properties['-r'] !== undefined) {
      bot.withoutLogTitle().baseInfo(pluginName, JSON.stringify(entity, null, 2));
    } else {
      showEntityInfo(bot, entity, displayProperties);
    }
    bot.withoutLogTitle().baseInfo(pluginName, '');
  }
  bot.withoutLogTitle().baseInfo(pluginName, `Around ${entities.length} entities`);
}

function getItemName(item: prisItem.Item) {
  return item.customName ?? 
        TranslateUtil.translate(item.name) ?? 
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

function showInventory(bot: mineflayer.Bot, start: number, end: number, args: Record<string, string>) {
  const currentWindow = bot.currentWindow ?? bot.inventory;
  const emptySlotCount = currentWindow.emptySlotCount();
  const totalSlotCount = currentWindow.inventoryEnd - currentWindow.inventoryStart;

  start = Math.max(start, 0);
  end = Math.min(end, currentWindow.inventoryEnd);

  if (start > end) {
    bot.baseError(pluginName, `start ${start} must be less than end ${end}`);
    return;
  }
  
  bot.withoutLogTitle().baseInfo(
    pluginName,
    `CurrentWindow: ${getAnsi(bot, currentWindow.title)}. ${totalSlotCount - emptySlotCount} / ${totalSlotCount}`
  );

  const option = {
    count: args['-c'] !== undefined,
    enchant: args['-e'] !== undefined,
    durability: args['-d'] !== undefined,
  };
  for (let i = start; i < end; i++) {
    const item = currentWindow.slots[i];
    if (!item) continue;
    
    const info = showItemInfoInline(item, option);
    bot.withoutLogTitle().baseInfo(pluginName, `[${padZero(i)}] ${info}`);
  }
}

function showItemInfoInline(item: prisItem.Item | null, option?: ShowItemOption) {
  if (!item) {
    return `Empty`;
  }
  if (!option) {
    option = {
      count: true,
      enchant: true,
      durability: true,
    };
  }
  let info = `${getItemName(item)}`;
    
  if (option.durability && item.maxDurability) {
    info += `\t耐久: ${item.maxDurability - item.durabilityUsed}/${item.maxDurability}`;
  }
  if (option.count && item.stackSize !== 1) {
    info += `\t数量: ${item.count}/${item.stackSize}`;
  }
  if (option.enchant && item.enchants.length > 0) {
    info += `\t附魔: [${getEnchantList(item)}]`;
  }
  return info;
}

function showMatchItems(bot: mineflayer.Bot, toPlayer: string) {
  const inventoryStart = bot.inventory.inventoryStart;
  const inventoryEnd = bot.inventory.inventoryEnd;
  const showInfoList: Array<string> = [];

  const option = {
    count: true,
    enchant: true
  };

  for (let i = inventoryStart; i < inventoryEnd; i++) {
    const item = bot.inventory.slots[i];
    if (!item) continue;
    if (item.name === 'fishing_rod') continue;
    if (!bot.isItemMatch(item)) continue;
    const info = showItemInfoInline(item, option);
    showInfoList.push(info.replace("\t", ' '));
  }

  for (let i = 0; i < showInfoList.length; i++) {
    bot.withoutLogTitle().baseInfo(pluginName, showInfoList[i]!);
    bot.createOnceTimeTask(`showMatchItem_${i}`, () => {
      bot.whisper(toPlayer, showInfoList[i]!);
    }, i * 5);
  }
}


function registCmd(bot: mineflayer.Bot) {
  const CommandManager = bot.getCommandManager();
  bot.registerCmd(CommandManager.command('info')
    .then(CommandManager.command(['inv', 'inventory'])
      .execute((bot, args) => {
        const window = bot.currentWindow ?? bot.inventory;
        showInventory(bot, window.inventoryStart, window.inventoryEnd, args);
      })
      .then(CommandManager.argument(['-e', '--enchant']))
      .then(CommandManager.argument(['-d', '--durability']))
      .then(CommandManager.argument(['-c', '--count']))
    )
    .then(CommandManager.command(['cont', 'container'])
      .execute((bot, args) => {
        if (!bot.currentWindow) {
          bot.baseError(pluginName, 'no container');
          return;
        }

        const window = bot.currentWindow;
        showInventory(bot, 0, window.inventoryStart, args);
      })
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
      .execute((bot, args) => showEntityAround(bot, args))
      .then(CommandManager.argument('--name'))
      .then(CommandManager.argument('--displayName'))
      .then(CommandManager.argument('--type'))
      .then(CommandManager.argument('--entityType'))
      .then(CommandManager.argument('--display'))
      .then(CommandManager.argument('--username'))
      .then(CommandManager.argument('-c'))  // count
      .then(CommandManager.argument('-r'))  // raw
      .then(CommandManager.argument('-d'))  // distance
    )
    .then(CommandManager.command('show')
      .then(CommandManager.command('matchItems')
        .then(CommandManager.value('<Player>')
          .suggests(() => Object.keys(bot.players))
          .execute(showMatchItems)))
    )
  );
}


export default async function inject(bot: mineflayer.Bot) {
  await waitPluginLoads(bot, ['logger', 'command']);

  bot.showItem = (item: prisItem.Item) => showItemInfo(bot, item);
  bot.showHandItem = () => showHandItem(bot);
  bot.showRawItem = (item: prisItem.Item) => showRawItemInfo(bot, item);
  bot.showItemInSlot = (slot: number) => showItemInSlot(bot, slot, true);
  bot.showEntityInfo = (entity: prismEntity.Entity, displayProperties?: Array<string>) => showEntityInfo(bot, entity, displayProperties ?? []);
  bot.showItemInfoInline = showItemInfoInline;

  registCmd(bot);

  pluginReady(bot, pluginName);
}

declare module 'mineflayer' {
  interface Bot {
    showItem(item: prisItem.Item): void;
    showHandItem(raw?: boolean): void;
    showRawItem(item: prisItem.Item): void;
    showItemInSlot(slot: number, raw?: boolean): void;
    showEntityInfo(entity: prismEntity.Entity, displayProperties?: Array<string>): void;
    showItemInfoInline(item?: prisItem.Item | null, option?: ShowItemOption): string;
  }
}


interface ShowItemOption {
  durability?: boolean;
  count?: boolean;
  enchant?: boolean;
}