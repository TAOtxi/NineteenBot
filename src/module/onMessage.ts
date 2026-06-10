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
}


type MatcherCallback = (match: string[]) => void;

declare module 'mineflayer' {
  interface BotEvents {
    'chat:onQQMessage': MatcherCallback,
  }
}
