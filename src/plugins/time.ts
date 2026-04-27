import mineflayer from 'mineflayer';
import { pluginReady } from '../utils/pluginWaiter.js';

export default function inject(bot: mineflayer.Bot) {
  bot.ticker = 0;
  bot.maxTicker = Infinity;

  bot.resetTicker = () => {
    bot.ticker = 0;
  }
  bot.on('physicsTick', () => {
    if (++bot.ticker >= bot.maxTicker) {
      bot.resetTicker();
    }
  })
  pluginReady(bot, 'time');
}

declare module 'mineflayer' {
  interface Bot {
    ticker: number;
    maxTicker: number;
    resetTicker: () => void;
  }
}
