import mineflayer from 'mineflayer';
import Logger from '../utils/Logger.js';

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

export default {
    statEntityCount,
    outputEntityCount,
}