import mineflayer from 'mineflayer';
import CmdParser from '../utils/CmdParser.js';
import Logger from '../utils/Logger.js';
import T from '../utils/TranslateUtil.js';

const logger = Logger.getLogger('InventoryInfo');


function showHelp() {
  logger.withoutPrefix().info('============== Inventory Help ==============');
  logger.withoutPrefix().info('show:                     显示当前库存物品');
  logger.withoutPrefix().info('-id, --identifier <id>:   筛选物品ID');
  logger.withoutPrefix().info('-n,  --name <name>:       筛选物品名称');
  logger.withoutPrefix().info('-e,  --enchant <enchant>: 筛选物品附魔');
  logger.withoutPrefix().info('-s,  --slot <slot>:       筛选物品槽位');
  logger.withoutPrefix().info('-at, --attribute <attr>:  筛选物品属性');
  logger.withoutPrefix().info('============================================');
}


export default function (bot: mineflayer.Bot, parseCmd: CmdParser) {
  if (parseCmd.isCmd(['help', '?']) || parseCmd.isEmptyCmd()) {
    showHelp();
    return;
  }
  
  logger.withoutPrefix().info('============== Inventory Info ==============');
  let items = bot.inventory.items();
  if (parseCmd.isCmd('show')) {
    const itemMap: Record<string, number> = {};
    for (const item of items) {
      if (itemMap[item.name]) {
        itemMap[item.name]! += item.count;
      } else {
        itemMap[item.name] = item.count;
      }
    }
    Object.keys(itemMap).forEach(key => {
      const name = T.tryTranslate(`item.minecraft.${key}`) ?? 
                   T.tryTranslate(`block.minecraft.${key}`) ?? 
                   key;
      logger.withoutPrefix().info(`${name} x${itemMap[key]}`);
    });

    logger.withoutPrefix().info('============================================');
    return;
  }

  if (parseCmd.hasArg(['-id', '--identifier'])) {
    const id = parseCmd.getValue(['-id', '--identifier']);
    items = items.filter(item => item.name === id);
  }

  if (parseCmd.hasArg(['-n', '--name'])) {
    const name = parseCmd.getValue(['-n', '--name']);
    items = items.filter(item => item.displayName === name);
  }

  if (parseCmd.hasArg(['-e', '--enchant'])) {
    const enchant = parseCmd.getValue(['-e', '--enchant']);
    items = items.filter(item => item.enchants.some(ent => ent.name === enchant));
  }

  if (parseCmd.hasArg(['-s', '--slot'])) {
    const slot = parseCmd.getValue(['-s', '--slot']);
    if (slot !== undefined && slot.match(/^\d+$/)) {
      items = items.filter(item => item.slot === parseInt(slot));
    } else {
      logger.error('Slot must be a number');
    }
  }

  if (parseCmd.hasArg(['-at', '--attribute']) && items.length > 0) {
      const attrs = parseCmd.getValue(['-at', '--attribute'])!.split(',');
      for (const item of items) {
        const map: Record<string, string> = {};
        for (const attr of attrs) {
          map[attr] = Reflect.get(item, attr);
        }
        map['name'] = T.tryTranslate(`item.minecraft.${item.name}`) ?? 
                     T.tryTranslate(`block.minecraft.${item.name}`) ?? 
                     item.name;
        logger.withoutPrefix().info(JSON.stringify(map, null, 2));
      }
      logger.withoutPrefix().info('============================================');
      return;
    }


  for (const item of items) {
    logger.withoutPrefix().info(JSON.stringify(item, null, 2));
  }
  logger.withoutPrefix().info('============================================');
}