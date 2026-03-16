import mineflayer from 'mineflayer';
import Logger from '../utils/Logger.js';
import { Vec3 } from 'vec3';
import CmdParser from '../utils/ArgsUtil.js';

const logger = Logger.getLogger('Behavior');

function degToRad(deg: number) {
  return deg * Math.PI / 180;
}

export default function handleCmd(bot: mineflayer.Bot, parseCmd: CmdParser) {
  if (parseCmd.isCmd('look')) {
    if (parseCmd.hasArg(['-r', '--rotate'])) {
      const rotate = parseCmd.getValue(['-r', '--rotate'])!.split(',');
      if (rotate[0] === undefined || rotate[1] === undefined) {
        logger.error('Invalid rotate format');
        return;
      }
      bot.look(degToRad(parseFloat(rotate[0])), degToRad(parseFloat(rotate[1])), true);
    } else if (parseCmd.hasArg(['-p', '--position'])) {
      const position = parseCmd.getValue(['-p', '--position'])!.split(',');
      if (position[0] === undefined || position[1] === undefined || position[2] === undefined) {
        logger.error('Invalid position format');
        return;
      }
      const vec = new Vec3(parseFloat(position[0]), parseFloat(position[1]), parseFloat(position[2]));
      bot.lookAt(vec, true);
    }
  }

  else if (parseCmd.isCmd('fish')) {
    bot.fish();
    logger.info('Start fishing...');
  }

  else if (parseCmd.isCmd('get')) {
    const attr = parseCmd.dive().getFirstCmd();
    if (!attr) {
      logger.error('Invalid attribute');
      return;
    }
    const value = Reflect.get(bot, attr);
    if (value === undefined) {
      logger.error(`Attribute ${attr} not found`);
      return;
    }
    logger.withoutPrefix().info(`${attr}: ${JSON.stringify(value, null, 2)}`);
  }

  else if (parseCmd.isCmd('set')) {
    if (parseCmd.hasArg(['-p', '--physicsEnabled'])) {
      const value = parseCmd.getValue(['-p', '--physicsEnabled']) === 'true';
      bot.physicsEnabled = value;
      logger.info(`Physics enabled: ${value}`);
    }
  }
}