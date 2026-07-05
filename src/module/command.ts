import mineflayer from 'mineflayer';
import { getTaskMap } from './applyTask.js';
import { addTask, removeTask, getBotMap } from './botManager.js';
import { getInventoryEmptySlotCount } from '../utils/InventoryUtil.js';

export default function registCmd(bot: mineflayer.Bot) {
  const CM = bot.getCommandManager();

  bot.registerCmd(CM.command(['cls', 'clear'])
    .execute(bot => {
      console.clear();
    }));

  // TODO: 完善help命令
  bot.registerCmd(CM.command('help')
    .execute(bot => {
      // console.clear();
    }));

  bot.registerCmd(CM.command(['msg', 'chat', '.'])
    .then(CM.value('<Message or Command>')
      .execute((bot, value) => {
        value && bot.chat(value);
      }))
  );

  bot.registerCmd(CM.command('state')
    .then(CM.command('getYawPitch')
      .execute(bot => bot.baseInfo('state', JSON.stringify(bot.getNotchYawPitch()))))
    .then(CM.command('get')
      .then(CM.value('<property>')
        // @ts-ignore
        .suggests(() => Object.keys(bot).filter(key => !key.startsWith('_') && typeof bot[key] !== 'function'))
        .execute((bot, property) => {
          // @ts-ignore
          if (typeof bot[property] === 'object' && bot[property] !== null) {
            bot.baseInfo('state', `${property}:`);
            // @ts-ignore
            console.log(bot[property]);
          } else {
            // @ts-ignore
            bot.baseInfo('state', `${property}: ${bot[property]}`);
          }
        })))
    .then(CM.command('getStr')
      .then(CM.value('<property>')
        // @ts-ignore
        .suggests(() => Object.keys(bot).filter(key => !key.startsWith('_') && typeof bot[key] !== 'function'))
        .execute((bot, property) => {
          // @ts-ignore
          bot.baseInfo('state', `${property}: ${JSON.stringify(bot[property], null, 2)}`);
        })))
    .then(CM.command('fix')
      .then(CM.command('isAlive')
        // @ts-ignore
        .execute(bot => bot.isAlive = true)))
  );

  bot.registerCmd(CM.command('who')
    .execute(bot => bot.baseInfo('BOT', bot.identifier))
  );

  bot.registerCmd(CM.command('task')
    .then(CM.command('list')
      .execute(bot => {
        bot.baseInfo('task', `Task List: (Current Tick: ${bot.ticker})`);
        for (const task of bot.timeTaskList) {
          bot.baseInfo('task', `[${task.id}]:\tNext Run Tick: ${task.nextRunTick}.\tInterval: ${task.intervalGetter}.`);
        }
        bot.withoutLogTitle().baseInfo('task', '');
      }))
    .then(CM.command('apply')
      .then(CM.value('<task>')
        .suggests(() => Object.keys(getTaskMap()))
        .execute((bot, task) => {
          const taskMap = getTaskMap();
          // addTask(bot, task);
          // @ts-ignore
          taskMap[task](bot);
          bot.baseInfo('task', `Apply Task: ${task}`);
        })))
    .then(CM.command('add')
      .then(CM.value('<task>')
        .suggests(() => Object.keys(getTaskMap()))
        .execute((bot, task) => {
          addTask(bot, task);
          bot.baseInfo('task', `Add Task: ${task}`);
        })))
    .then(CM.command('remove')
      .then(CM.value('<task>')
        .suggests(() => Object.keys(getTaskMap()))
        .execute((bot, task) => {
          removeTask(bot, task);
          bot.baseInfo('task', `Remove Task: ${task}`);
        })))
  );

  bot.registerCmd(CM.command('list')
    .execute(displayOnlinePlayers)
  );

  bot.registerCmd(CM.command('tps')
    .execute(bot => bot.baseInfo('tps', `Current TPS: ${bot.getTps()}`))
  );

  bot.registerCmd(CM.command('q')
    .then(CM.command('inv')
      .execute(bot => {
        bot.tryExecute('info inv -c -d -e');
      }))
    .then(CM.command('cont')
      .execute(bot => {
        bot.tryExecute('info cont -c -d -e');
      }))
    .then(CM.command(['h', 'harvest'])
      .execute(bot => {
        bot.tryExecute('all "info show matchItems TAOtxi"');
      }))
    .then(CM.command('1')
      .execute(bot => {
        bot.chat('/stp survival');
      }))
    .then(CM.command('2')
      .execute(bot => {
        bot.chat('/stp survival2');
      }))
    .then(CM.command('3')
      .execute(bot => {
        bot.chat('/stp industry');
      }))
    .then(CM.command('tp')
      .execute(bot => {
        bot.chat('/tpa TAOtxi');
      }))
    .then(CM.command('fish')
      .execute(bot => {
        bot.tryExecute('all "fish on"');
      })
      .then(CM.command('stop')
        .execute(bot => {
          bot.tryExecute('all "fish off"');
        }))
    )
    .then(CM.command('clean')
      .execute(bot => {
        bot.tryExecute('all "fish clean"');
      }))
    .then(CM.command('drop')
      .execute(bot => {
        bot.tryExecute('all "ad test"');
      }))
    .then(CM.command('sign')
      .execute(bot => {
        bot.tryExecute('all "task apply signIn"');
      }))
    .then(CM.command('water')
      .execute(bot => {
        bot.tryExecute('all "task apply water"');
      }))
    .then(CM.command('usage')
      .execute(bot => {
        const botMap = getBotMap();
        for (const bot of Object.values(botMap)) {
          const window = bot.currentWindow ?? bot.inventory;
          const totalSlot = window.inventoryEnd - window.inventoryStart;
          const emptySlot = getInventoryEmptySlotCount(window);
          bot.chat(`/w TAOtxi Usage: ${totalSlot - emptySlot} / ${totalSlot}`);
        }
      }))
    .then(CM.command('next')
      .execute(bot => {
        const botMap = getBotMap();
        const botIds = Object.keys(botMap);
        if (botIds.length < 2) return;

        const index = botIds.indexOf(bot.identifier);
        const next = (index + 1) % botIds.length;

        bot.tryExecute(`bot change ${botIds[next]}`);
      }))
    .then(CM.command('select')
      .execute(bot => {
        bot.tryExecute(`bot change ${bot.identifier}`);
      }))
  );
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