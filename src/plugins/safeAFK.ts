import mineflayer from 'mineflayer'
import { pluginReady, waitPluginLoads } from '../utils/pluginWaiter.js'


const defaultConfig = {
  tpsThreshold: 10,
  triggerCommand: '/spawn'
}

function checkTps(bot: mineflayer.Bot) {
  if (bot.getTps() < bot.getConfig(pluginName, 'tpsThreshold')) {
    const command = bot.getConfig(pluginName, 'triggerCommand');
    bot.baseWarn(pluginName, `TPS dropped to ${bot.getTps()}`);
    if (command) {
      bot.chat(command);
    }
    bot.disableSafeAFK();
  }
}

const pluginName = 'safeAFK';
const CHECK_TASK = `${pluginName}_check`;
export default async function inject(bot: mineflayer.Bot) {
  await waitPluginLoads(bot, ['tps', 'makeConfig', 'command']);
  bot.loadConfig(pluginName, defaultConfig);

  bot.enableSafeAFK = () => {
    if (!bot.hasTimeTask(CHECK_TASK)) {
      bot.createTimeTask(CHECK_TASK, checkTps, 20);
    }
    bot.baseInfo(pluginName, 'SafeAFK enabled');
  }
  bot.disableSafeAFK = () => {
    bot.removeTimeTask(CHECK_TASK);
    bot.baseInfo(pluginName, 'SafeAFK disabled');
  }

  const CommandManager = bot.getCommandManager();
  bot.registerCmd(CommandManager.command(pluginName)
    .then(CommandManager.command('enable')
      .execute(bot => {
        bot.enableSafeAFK();
      }))
    .then(CommandManager.command('disable')
      .execute(bot => {
        bot.disableSafeAFK();
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
    enableSafeAFK(): void;
    disableSafeAFK(): void;
  }
}
