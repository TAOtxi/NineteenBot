import mineflayer from 'mineflayer';


function inject(bot: mineflayer.Bot) {
  bot.on('physicsTick', () => {
    // AutoDrop.tick();
  });
}