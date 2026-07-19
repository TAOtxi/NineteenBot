import mineflayer from 'mineflayer';

function fishTask(bot: mineflayer.Bot) {
  // bot.addTask('autoGet24Reward', true);
  bot.once('spawn', () => {
    bot.chat('/stp survival2');

    bot.createOnceTimeTask("doFish", () => {
      bot.chat('/home fish');
      bot.startFishing();
      bot.enableAutoDrop();
      bot.startAutoReplace();
      bot.startAutoRepair();
    }, 20 * 10);
  })
}

function fishTask1(bot: mineflayer.Bot) {
  // bot.addTask('autoGet24Reward', true);
  bot.once('spawn', () => {
    bot.chat('/stp survival');

    bot.createOnceTimeTask("doFish", () => {
      bot.chat('/home fish');
      bot.startFishing();
      bot.enableAutoDrop();
      bot.startAutoReplace();
      // bot.startAutoRepair();
    }, 20 * 10);
  })
}

export {
  fishTask,
  fishTask1,
}