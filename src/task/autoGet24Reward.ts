import mineflayer from 'mineflayer'


export default function task(bot: mineflayer.Bot) {
  bot.addChatPattern(
    'onReward', 
    /^\[ItemsAdder\] 获得物品 拾玖点券$/, 
    { parse: false, repeat: true }
  );

  bot.on('chat:onReward', () => {
    if (bot.hasTask('fish')) {
      bot.removeTask('fish');
      bot.addTask('fish1');
      // bot.stopAutoRepair();
      bot.chat('/stp survival');
    } else if (bot.hasTask('fish1')) {
      bot.removeTask('fish1');
      bot.addTask('fish');
      bot.chat('/stp survival2');

      // bot.createOnceTimeTask('openAutoRepair', () => {
      //   bot.startAutoRepair();
      // }, 20 * 10);
    }
  })
}


type MatcherCallback = (match: string[]) => void;

declare module 'mineflayer' {
  interface BotEvents {
    'chat:onReward': MatcherCallback,
  }
}