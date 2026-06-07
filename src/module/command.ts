import mineflayer from 'mineflayer';
import { getTaskMap } from './applyTask.js';
import { addTask, removeTask } from './botManager.js';

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
          addTask(bot, task);
          // @ts-ignore
          taskMap[task](bot);
          bot.baseInfo('task', `Apply Task: ${task}`);
        })))
    .then(CommandManager.command('add')
      .then(CommandManager.value('<task>')
        .suggests(() => Object.keys(getTaskMap()))
        .execute((bot, task) => {
          addTask(bot, task);
          bot.baseInfo('task', `Add Task: ${task}`);
        })))
    .then(CommandManager.command('remove')
      .then(CommandManager.value('<task>')
        .suggests(() => Object.keys(getTaskMap()))
        .execute((bot, task) => {
          removeTask(bot, task);
          bot.baseInfo('task', `Remove Task: ${task}`);
        })))
  );

  bot.registerCmd(CommandManager.command('list')
    .execute(displayOnlinePlayers)
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
    .then(CommandManager.command('clean')
      .execute(bot => {
        bot.tryExecute('all "fish clean"');
      }))
  )
}


function displayOnlinePlayers(bot: mineflayer.Bot) {
  const worlds: Record<string, string[]> = {};
  bot.withoutLogTitle().baseInfo('CMD', '=======================================');
  bot.withoutLogTitle().baseInfo('CMD', `Total Players: ${Object.keys(bot.players).length}`);
  // TODO: 匹配逻辑待优化
  for (const player of Object.values(bot.players)) {
    // toAnsi ==>  \x1B[0m\x1B[90m[\x1B[38;2;225;249;232m\x1B[1m传送大厅\x1B[90m]\x1B[97mTAOtxi\x1B[0m
    const styleName = player.displayName.toAnsi();
    const prefixEnd = styleName.indexOf(']');
    const worldName = prefixEnd !== -1 ? styleName.substring(0, prefixEnd + 1) : 'unknown';
    if (worlds[worldName] === undefined) {
      worlds[worldName] = [];
    }
    worlds[worldName].push(player.username);
  }
  const worldList = Object.keys(worlds).sort();
  if (worldList.length === 1 && worldList[0] === 'unknown') {
    bot.withoutLogTitle().baseInfo('CMD', `${worlds[worldList[0]]?.join(', ')}`);
  } else {
    for (const world of worldList) {
      bot.withoutLogTitle().baseInfo('CMD', `${world}\x1b[0m ${worlds[world]!.join(', ')}`);
    }
  }
  bot.withoutLogTitle().baseInfo('CMD', '\x1b[0m=======================================');
}