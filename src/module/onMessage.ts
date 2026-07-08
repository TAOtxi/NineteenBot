import mineflayer from 'mineflayer';

export default function onMessage(bot: mineflayer.Bot) {
  bot.addChatPattern(
    'onQQMessage', 
    /^\[!\]\[拾玖世界同好会.*?\(1321075268\)>&quit (\w+)$/, 
    { parse: true, repeat: true }
  );

  bot.on('chat:onQQMessage', (match: string[]) => {
    const user = match[0]![0]!;
    if (user === bot.username && bot.identifier.includes('拾玖世界')) {
      bot.tryExecute('quit');
    }
  })

  bot.addChatPattern(
    'onReward', 
    /^\[Server -> me\] 24小时在线奖励/, 
    { parse: false, repeat: true }
  );

  bot.on('chat:onReward', (match: string[]) => {
    bot.chat('');
  })
}


type MatcherCallback = (match: string[]) => void;

declare module 'mineflayer' {
  interface BotEvents {
    'chat:onQQMessage': MatcherCallback,
    'chat:onReward': MatcherCallback,
  }
}
