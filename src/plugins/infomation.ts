import mineflayer from 'mineflayer';
import prisItem from 'prismarine-item';
import prismEntity from 'prismarine-entity';
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

function showInventory(bot: mineflayer.Bot, args: Record<string, string>) {
  const l = bot.inventory.inventoryStart;
  const r = bot.inventory.inventoryEnd;
  for (let i = l; i < r; i++) {
    const item = bot.inventory.slots[i];
    if (!item) continue;
    
    const info = getItemInfoInline(bot, i, args);
    bot.withoutLogTitle().baseInfo(pluginName, info);
  }
}

function getItemInfoInline(bot: mineflayer.Bot, slot: number, args: Record<string, string>) {
  const item = bot.inventory.slots[slot];
  if (!item) {
    return `[${padZero(slot)}] Empty`;
  }
  let info = `[${padZero(slot)}] ${getItemName(item)}`;
    
  if (args['-d'] !== undefined && item.maxDurability) {
    info += `\t耐久: ${item.maxDurability - item.durabilityUsed}/${item.maxDurability}`;
  }
  if (args['-c'] !== undefined && item.stackSize !== 1) {
    info += `\t数量: ${item.count}/${item.stackSize}`;
  }
  if (args['-e'] !== undefined && item.enchants.length > 0) {
    info += `\t附魔: [${getEnchantList(item)}]`;
  }
  return info;
}

function showMatchItems(bot: mineflayer.Bot, toPlayer: string) {
  const inventoryStart = bot.inventory.inventoryStart;
  const inventoryEnd = bot.inventory.inventoryEnd;
  const showInfoList: Array<string> = [];
  for (let i = inventoryStart; i < inventoryEnd; i++) {
    const item = bot.inventory.slots[i];
    if (!item) continue;
    if (item.name === 'fishing_rod') continue;
    if (!bot.isItemMatch(item)) continue;
    const info = getItemInfoInline(bot, i, {'-c':'', '-e': ''}).replace("\t", ' ');
    showInfoList.push(info);
  }

  for (let i = 0; i < showInfoList.length; i++) {
    bot.withoutLogTitle().baseInfo(pluginName, showInfoList[i]!);
    bot.createOnceTimeTask(`showMatchItem_${i}`, i * 5, () => {
      bot.whisper(toPlayer, showInfoList[i]!);
    });
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
      .execute((bot, args) => showEntityAround(bot, args))
      .then(CommandManager.argument('--name'))
      .then(CommandManager.argument('--displayName'))
      .then(CommandManager.argument('--type'))
      .then(CommandManager.argument('--entityType'))
      .then(CommandManager.argument('--display'))
      .then(CommandManager.argument('--username'))
      .then(CommandManager.argument('-c'))
      .then(CommandManager.argument('-r'))
      .then(CommandManager.argument('-d'))
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

  registCmd(bot);

  pluginReady(bot, pluginName);
}

declare module 'mineflayer' {
  interface Bot {
    showItem: (item: prisItem.Item) => void;
    showHandItem: (raw?: boolean) => void;
    showRawItem: (item: prisItem.Item) => void;
    showItemInSlot: (slot: number, raw?: boolean) => void;
    showEntityInfo: (entity: prismEntity.Entity, displayProperties?: Array<string>) => void;
  }
}
