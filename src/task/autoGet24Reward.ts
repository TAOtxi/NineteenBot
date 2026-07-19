import mineflayer from 'mineflayer'


export default function task(bot: mineflayer.Bot) {
  bot.addChatPattern(
    'onReward', 
    /^\[Server -> me\] 24小时在线奖励/, 
    // /^<TAOtxi> 1/, 
    { parse: false, repeat: true }
  );

  bot.on('chat:onReward', () => {
    if (bot.hasTask('fish')) {
      bot.removeTask('fish');
      bot.addTask('fish1');
      bot.chat('/stp survival');
    } else if (bot.hasTask('fish1')) {
      bot.removeTask('fish1');
      bot.addTask('fish');
      bot.chat('/stp survival2');
    }
  })
}


type MatcherCallback = (match: string[]) => void;

declare module 'mineflayer' {
  interface BotEvents {
    'chat:onReward': MatcherCallback,
  }
}