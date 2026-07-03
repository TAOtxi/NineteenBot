import mineflayer from 'mineflayer'
import { pluginReady } from '../utils/pluginWaiter.js';


function onSetTime(bot: mineflayer.Bot, gameTick: number) {
  if (bot._lastTick === -1) {
    bot._lastTick = gameTick;
    bot._lastTime = Date.now();
    return;
  }

  const now = Date.now();
  const deltaTick = gameTick - bot._lastTick;

  if (deltaTick === 0) return;

  const deltaTime = now - bot._lastTime;
  bot._lastTime = now;
  bot._lastTick = gameTick;

  const instantMsTps = deltaTime / deltaTick;  
  bot._msTps = 0.8 * bot._msTps + 0.2 * instantMsTps;
}

function resetTime(bot: mineflayer.Bot) {
  bot._msTps = 50.0;
  bot._lastTime = -1;
  bot._lastTick = -1;
}

function round1(num: number) {
  return Math.round(num * 10) / 10;
}

const pluginName = 'tps';
export default function inject(bot: mineflayer.Bot) {
  bot._msTps = 50.0;
  bot._lastTime = -1;
  bot._lastTick = -1;

  bot._client.on('update_time', (packet) => {
    onSetTime(bot, parseInt(packet.age));
  })

  bot.on('respawn', () => resetTime(bot));

  bot.getMsTps = () => {
    if (bot._msTps < 50.0) {
      return 50.0;
    }
    return round1(bot._msTps);
  }

  bot.getTps = () => {
    const msTps = bot.getMsTps();
    return round1(1000.0 / msTps);
  }

  pluginReady(bot, pluginName);
}


declare module 'mineflayer' {
  interface Bot {
    _msTps: number;
    _lastTime: number;
    _lastTick: number;
    getMsTps(): number;
    getTps(): number;
  }
}
