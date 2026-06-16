import mineflayer from 'mineflayer';

export default function onMessage(bot: mineflayer.Bot) {
  // bot.addChatPattern(
  //   'onQQMessage', 
  //   /^\[!\]\[拾玖世界同好会.*?\(1321075268\)>&(\/.*)$/, 
  //   { parse: true, repeat: true }
  // );

  // bot.on('chat:onQQMessage', (match: string[]) => {
  //   const message = match[0]!;
  //   bot.chat(message);
  // })

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
