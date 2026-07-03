import mineflayer from 'mineflayer'
import { pluginReady, waitPluginLoads } from '../utils/pluginWaiter.js'


const defaultConfig = {
  tpsThreshold: 10,
  greenThreshold: 17,
  triggerCommand: '/spawn',
  greenTriggerCommand: '/back',
}

function greenCheck(bot: mineflayer.Bot) {
  if (bot.getTps() < bot.getConfig(pluginName, 'greenThreshold')) {
    return;
  }
  const command = bot.getConfig(pluginName, 'greenTriggerCommand');
  if (!command) {
    throw new Error('greenTriggerCommand not set');
  }
  bot.chat(command);
  bot.baseInfo(pluginName, `TPS increased to ${bot.getTps()}`);
  bot.removeTimeTask(GREEN_CHECK);

  bot.createOnceTimeTask(OPEN_CHECK, () => {
    bot.enableTpsCheck();
  }, 20 * 5);
}

function checkTps(bot: mineflayer.Bot) {
  if (bot.getTps() < bot.getConfig(pluginName, 'tpsThreshold')) {
    const command = bot.getConfig(pluginName, 'triggerCommand');
    bot.baseWarn(pluginName, `TPS dropped to ${bot.getTps()}`);
    if (command) {
      bot.chat(command);
    }
    bot.disableTpsCheck();

    const greenTriggerCommand = bot.getConfig(pluginName, 'greenTriggerCommand');
    if (!greenTriggerCommand) {
      return;
    }
    bot.createTimeTask(GREEN_CHECK, greenCheck, 20);
  }
}

const pluginName = 'tpsChecker';
const CHECK_TASK = `${pluginName}_check`;
const GREEN_CHECK = `${pluginName}_green_check`;
const OPEN_CHECK = `${pluginName}_open_check`;


export default async function inject(bot: mineflayer.Bot) {
  await waitPluginLoads(bot, ['tps', 'makeConfig', 'command']);
  bot.loadConfig(pluginName, defaultConfig);

  bot.enableTpsCheck = () => {
    if (!bot.hasTimeTask(CHECK_TASK)) {
      bot.createTimeTask(CHECK_TASK, checkTps, 20);
    }
    bot.removeTimeTask(GREEN_CHECK);
    bot.baseInfo(pluginName, 'TpsChecker enabled');
  }
  bot.disableTpsCheck = () => {
    bot.removeTimeTask(CHECK_TASK);
    bot.baseInfo(pluginName, 'TpsChecker disabled');
  }

  const CommandManager = bot.getCommandManager();
  bot.registerCmd(CommandManager.command(pluginName)
    .then(CommandManager.command('enable')
      .execute(bot => {
        bot.enableTpsCheck();
      }))
    .then(CommandManager.command('disable')
      .execute(bot => {
        bot.disableTpsCheck();
      }))
    .then(CommandManager.command('threshold')
      .then(CommandManager.value('<threshold>')
        .execute((bot, value) => {
          bot.setConfig(pluginName, 'tpsThreshold', parseInt(value));
          bot.baseInfo(pluginName, `tpsThreshold set to ${value}`);
        })))
  );

  pluginReady(bot, pluginName);
}

declare module 'mineflayer' {
  interface Bot {
    enableTpsCheck(): void;
    disableTpsCheck(): void;
  }
}
