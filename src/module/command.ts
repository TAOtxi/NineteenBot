import mineflayer from 'mineflayer';
import { getTaskMap } from './applyTask.js';
import { removeTask } from './botManager.js';

export default function registCmd(bot: mineflayer.Bot) {
  const CommandManager = bot.getCommandManager();

  bot.registerCmd(CommandManager.command(['cls', 'clear'])
    .execute(bot => {
      console.clear();
    }));

  // TODO: 完善help命令
  bot.registerCmd(CommandManager.command('help')
    .execute(bot => {
      // console.clear();
    }));

  bot.registerCmd(CommandManager.command(['msg', 'chat', '.'])
    .then(CommandManager.value('<Message or Command>')
      .execute((bot, value) => {
        value && bot.chat(value);
      }))
  );

  bot.registerCmd(CommandManager.command('state')
    .then(CommandManager.command('getYawPitch')
      .execute(bot => bot.baseInfo('state', JSON.stringify(bot.getNotchYawPitch()))))
    .then(CommandManager.command('get')
      .then(CommandManager.value('<property>')
        // @ts-ignore
        .suggests(() => Object.keys(bot).filter(key => !key.startsWith('_') && typeof bot[key] !== 'function'))
        .execute((bot, property) => {
          // @ts-ignore
          bot.baseInfo('state', `${property}: ${JSON.stringify(bot[property], null, 2)}`);
        })))
    .then(CommandManager.command('fix')
      .then(CommandManager.command('isAlive')
        // @ts-ignore
        .execute(bot => bot.isAlive = true)))
  );

  bot.registerCmd(CommandManager.command('who')
    .execute(bot => bot.baseInfo('BOT', bot.identifier))
  );

  bot.registerCmd(CommandManager.command('task')
    .then(CommandManager.command('list')
      .execute(bot => {
        bot.baseInfo('task', `Task List: (Current Tick: ${bot.ticker})`);
        for (const task of bot.timeTaskList) {
          bot.baseInfo('task', `[${task.id}]:\tNext Run Tick: ${task.nextRunTick}.\tInterval: ${task.interval}.`);
        }
        bot.withoutLogTitle().baseInfo('task', '');
      }))
    .then(CommandManager.command('apply')
      .then(CommandManager.value('<task>')
        .suggests(() => Object.keys(getTaskMap()))
        .execute((bot, task) => {
          const taskMap = getTaskMap();
          // @ts-ignore
          taskMap[task](bot);
        })))
    .then(CommandManager.command('remove')
      .then(CommandManager.value('<task>')
        .suggests(() => Object.keys(getTaskMap()))
        .execute((bot, task) => {
          removeTask(bot, task);
        })))
  );

  bot.registerCmd(CommandManager.command('q')
    .then(CommandManager.command('inv')
      .execute(bot => {
        bot.tryExecute('info inv -c -d -e');
      }))
    .then(CommandManager.command(['h', 'harvest'])
      .execute(bot => {
        bot.tryExecute('all "info show matchItems TAOtxi"');
      }))
    .then(CommandManager.command('1')
      .execute(bot => {
        bot.chat('/stp survival');
      }))
    .then(CommandManager.command('2')
      .execute(bot => {
        bot.chat('/stp survival2');
      }))
    .then(CommandManager.command('tp')
      .execute(bot => {
        bot.chat('/tpa TAOtxi');
      }))
    .then(CommandManager.command('fish')
      .execute(bot => {
        bot.tryExecute('all "fish on"');
      }))
  )
}