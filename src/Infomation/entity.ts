import mineflayer from 'mineflayer';
import Logger from '../utils/Logger.js';
import CmdParser from '../utils/CmdParser.js';
import T from '../utils/TranslateUtil.js';
// @ts-ignore
import cycle from 'cycle';

const logger = Logger.getLogger('EntityInfo');

function statEntityCount(bot: mineflayer.Bot) {
  const countMap: Record<string, number> = {};
  for (const entity of Object.values(bot.entities)) {
    const name = entity.name || entity.type;
    countMap[name] = (countMap[name] || 0) + 1;
  }
  return countMap;
}

function outputEntityCount(bot: mineflayer.Bot) {
  const countMap = statEntityCount(bot);
  const sortCountMap = Object.entries(countMap).sort((a, b) => b[1] - a[1]);

  logger.withoutPrefix().info('================== Entity Stat =====================');
  for (const [name, count] of sortCountMap) {
    logger.withoutPrefix().info(`${T.t(`entity.minecraft.${name}`)}: ${count}`);
  }
  logger.withoutPrefix().info('====================================================');
}

// TODO: 待改进
function formatOutputEntityList(list: mineflayer.Bot['entity'][]) {
  logger.withoutPrefix().info('================ Entity List ==================');
  for (const entity of list) {
    logger.withoutPrefix().info(JSON.stringify(entity, null, 2));
  }
  logger.withoutPrefix().info('====================================================');
}

function showHelp() {
  logger.withoutPrefix().info('========== Entity Info Help ============');
  logger.withoutPrefix().info('stat:                统计实体数量');
  logger.withoutPrefix().info('-desc, --descending: 降序排序，默认升序');
  logger.withoutPrefix().info('-id, --identifier:   指定的实体ID');
  logger.withoutPrefix().info('-n,  --name:         指定的实体名称');
  logger.withoutPrefix().info('-c,  --count:        指定的实体数量');
  logger.withoutPrefix().info('-d,  --distance:     指定的实体距离');
  logger.withoutPrefix().info('-at, --attribute:    指定的实体属性');
  logger.withoutPrefix().info('========================================');
}

export default function handleCmd(bot: mineflayer.Bot, parseCmd: CmdParser) {
  if (parseCmd.isCmd(['help', '?']) || 
      parseCmd.isEmptyCmd()) {
        showHelp();
        return;
      }

  if (parseCmd.isCmd('stat')) {
    outputEntityCount(bot);
  } else {
    logger.withoutPrefix().info('================= Entity Infomation ==================');

    const pos = bot.entity.position;
    const sortType = parseCmd.hasArg(['-desc', '--descending']) ? -1 : 1;
    let list = Object.values(bot.entities).sort(    // 默认升序，也就是从近到远
      (a, b) => sortType * (a.position.distanceSquared(pos) - b.position.distanceSquared(pos)));  

    if (parseCmd.hasArg(['-id', '--identifier'])) {
      const id = parseCmd.getValue(['-id', '--identifier']);
      list = list.filter(entity => entity.name === id);
    }

    if (parseCmd.hasArg(['-n', '--name'])) {
      const name = parseCmd.getValue(['-n', '--name']);
      list = list.filter(entity => entity.displayName === name);
    }

    if (parseCmd.hasArg(['-c', '--count'])) {
      const count = parseInt(parseCmd.getValue(['-c', '--count'])!);
      list = list.slice(0, count);
    }

    if (parseCmd.hasArg(['-d', '--distance'])) {
      const distance = parseFloat(parseCmd.getValue(['-d', '--distance'])!);
      list = list.filter(entity => entity.position.distanceSquared(pos) <= distance * distance);
    }

    if (parseCmd.hasArg(['-at', '--attribute']) && list.length > 0) {
      const attrs = parseCmd.getValue(['-at', '--attribute'])!.split(',');
      for (const entity of list) {
        const map: Record<string, string> = {};
        for (const attr of attrs) {
          map[attr] = Reflect.get(entity, attr);
        }
        map['displayName'] = entity.username ?? entity.displayName ?? entity.type;
        map['type'] = T.t(`entity.minecraft.${entity.name}`);
        logger.withoutPrefix().info(JSON.stringify(map, null, 2));
      }
      return;
    }

    for (const entity of list) {
      logger.withoutPrefix().info(JSON.stringify(cycle.decycle(entity), null, 2));
    }
    logger.withoutPrefix().info('=======================================');
  }
}