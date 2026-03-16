import mineflayer from 'mineflayer';
import Logger from '../utils/Logger.js';
import CmdParser from '../utils/ArgsUtil.js';
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
  for (const [name, count] of sortCountMap) {
    logger.info(`${name}: ${count}`);
  }
}

// TODO: 待改进
function formatOutputEntityList(list: mineflayer.Bot['entity'][]) {
  for (const entity of list) {
    logger.info(JSON.stringify(entity, null, 2));
  }
}

function showHelp() {
  logger.withoutPrefix().info('================ Entity Info Help ==================');
  let helpStr = '';
  helpStr += '\tstat: 统计实体数量\n';
  helpStr += '\t-d, --descending: 降序排序 (默认升序)\n';
  helpStr += '\t-id, --identifier: 指定的实体ID\n';
  helpStr += '\t-n, --name: 指定的实体名称\n';
  helpStr += '\t-c, --count: 指定的实体数量\n';
  helpStr += '\t-at, --attribute: 指定的实体属性\n';
  logger.withoutPrefix().info(helpStr);
  logger.withoutPrefix().info('=======================================');
}

export default function handleCmd(bot: mineflayer.Bot, parseCmd: CmdParser) {
  if (parseCmd.isCmd('stat')) {
    outputEntityCount(bot);
  } else {
    logger.withoutPrefix().info('================= Entity Infomation ==================');

    const pos = bot.entity.position;
    const sortType = parseCmd.hasArg(['-d', '--descending']) ? -1 : 1;
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

    if (parseCmd.hasArg(['-at', '--attribute']) && list.length > 0) {
      const attrs = parseCmd.getValue(['-at', '--attribute'])!.split(',');
      for (const entity of list) {
        const map: Record<string, string> = {};
        for (const attr of attrs) {
          map[attr] = Reflect.get(entity, attr);
        }
        map['name'] = entity.username ?? entity.displayName ?? entity.type;
        logger.withoutPrefix().info(JSON.stringify(map, null, 2));
      }
      return;
    }

    for (const entity of list) {
      logger.withoutPrefix().info(JSON.stringify(cycle.decycle(entity), null, 2));
    }
    return list;
  }
}