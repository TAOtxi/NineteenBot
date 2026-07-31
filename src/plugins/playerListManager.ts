import mineflayer from "mineflayer";

const enterRegexs = [
  /^\w{1,16} join the game/,
]

const leaveRegexs = [
  /^\w{1,16} leave the game/,
]

const delay = 5 * 1000;

function addPlayer(bot: mineflayer.Bot, player: string) {
  if (bot._onlinePlayerMap[player]) {
    clearTimeout(bot._onlinePlayerMap[player]);
    bot._onlinePlayerMap[player] = null;
  } else {
    bot.emit('playerJoin', player);
    bot._onlinePlayerMap[player] = null;
  }
}

function removePlayer(bot: mineflayer.Bot, player: string) {
  if (!bot._onlinePlayerMap[player]) {
    bot._onlinePlayerMap[player] = setTimeout(() => {
      delete bot._onlinePlayerMap[player];
      bot.emit('playerLeave', player);
    }, delay);
  }
}

function onMessage(bot: mineflayer.Bot, message: string) {
  for (const regex of enterRegexs) {
    const match = message.match(regex);
    if (match) {
      addPlayer(bot, match[1]!);
      return;
    }
  }
  for (const regex of leaveRegexs) {
    const match = message.match(regex);
    if (match) {
      removePlayer(bot, match[1]!);
      return;
    }
  }
}

function initPlayerMap(bot: mineflayer.Bot) {
  for (const player of Object.keys(bot.players)) {
    bot._onlinePlayerMap[player] = null;
  }
}


export default function inject(bot: mineflayer.Bot) {
  bot._onlinePlayerMap = {};

  bot.on('messagestr', (message) => {
    onMessage(bot, message);
  });

  bot.once('spawn', () => initPlayerMap(bot));
}



declare module 'mineflayer' {
  interface Bot {
    _onlinePlayerMap: Record<string, NodeJS.Timeout | null>;
  }

  interface BotEvents {
    'playerJoin': (playerName: string) => void,
    'playerLeave': (playerName: string) => void,
  }
}