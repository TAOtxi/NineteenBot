import mineflayer from 'mineflayer';
import CmdParser from '../utils/ArgsUtil.js';
import Logger from '../utils/Logger.js';
import T from '../utils/TranslateUtil.js';

const logger = Logger.getLogger('InventoryInfo');



export default function (bot: mineflayer.Bot, parseCmd: CmdParser) {
  logger.withoutPrefix().info('============== Inventory Info ==============');

  let items = bot.inventory.items();
  if (parseCmd.isCmd(['-s', '--show'])) {
    const itemMap: Record<string, number> = {};
    for (const item of items) {
      if (itemMap[item.name]) {
        itemMap[item.name]! += item.count;
      } else {
        itemMap[item.name] = item.count;
      }
    }
    logger.withoutPrefix().info(JSON.stringify(itemMap, null, 2));
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
        map['name'] = T.t(`item.minecraft.${item.name}`);
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