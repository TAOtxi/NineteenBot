import mineflayer from 'mineflayer';

export default function onMessage(bot: mineflayer.Bot) {
  bot.addChatPattern(
    'onQQMessage', 
    /^\[!\]\[拾玖世界同好会.*?\(1321075268\)>&quit\s+(\w+)$/, 
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

  bot.addChatPattern(
    'onTpa', 
    /^(\w+) 请求传送到你这里/, 
    { parse: true, repeat: true }
  );

  bot.on('chat:onTpa', (match: string[]) => {
    const user = match[0]![0]!;
    bot.whisper(user, '挂机中，有事QQ艾特 TAOtxi~');
  })
}


type MatcherCallback = (match: string[]) => void;

declare module 'mineflayer' {
  interface BotEvents {
    'chat:onQQMessage': MatcherCallback,
    'chat:onReward': MatcherCallback,
    'chat:onTpa': MatcherCallback,
  }
}
