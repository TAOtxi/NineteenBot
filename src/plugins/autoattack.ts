import mineflayer from 'mineflayer'
import { pluginReady, waitPluginLoads } from '../utils/pluginWaiter.js';

const defaultConfig: Config = {
  interval: 11,
  attackMode: 'blacklist',
  attackList: ['player']
}


const pluginName = 'autoattack';
const ATTACK_TASK = `${pluginName}_attack`;


function attack(bot: mineflayer.Bot) {
  const heldItem = bot.heldItem;
  if (heldItem && heldItem.maxDurability) {
    if (heldItem.maxDurability - heldItem.durabilityUsed <= 1) {
      return;
    }
  }

  const entity = bot.entityAtCursor();  
  if (!entity?.name || !entity.isValid || entity.name === 'item') return;
  
  const attackList = bot.getConfig(pluginName, 'attackList') as Config['attackList'];
  const attackMode = bot.getConfig(pluginName, 'attackMode') as Config['attackMode'];
  if (
    attackMode === 'whitelist' && attackList.includes(entity.name) ||
    attackMode === 'blacklist' && !attackList.includes(entity.name)
  ) {
    bot.attack(entity);
  }
}

function getInterval(bot: mineflayer.Bot) {
  const interval = bot.getConfig(pluginName, 'interval') as Config['interval'];
  const tps = bot.getTps();

  return Math.max(1, Math.round(interval / (tps / 20)));
}

function registCmd(bot: mineflayer.Bot) {
  const CommandManager = bot.getCommandManager();
  bot.registerCmd(CommandManager.command([pluginName, 'attack'])
    .then(CommandManager.command('start')
      .execute(bot => {
        bot.startAutoAttack();
      }))
    .then(CommandManager.command('stop')
      .execute(bot => {
        bot.stopAutoAttack();
      }))
    .then(CommandManager.command('info')
      .execute(bot => {
        const tps = bot.getTps();
        const interval = getInterval(bot);
        bot.baseInfo(pluginName, `TPS: ${tps}, Interval: ${interval}`);
      }))
  );
}



export default async function inject(bot: mineflayer.Bot) {
  await waitPluginLoads(bot, ['tps', 'command', 'task', 'makeConfig']);
  bot.loadConfig(pluginName, defaultConfig);
  registCmd(bot);

  bot.startAutoAttack = () => {
    if (!bot.hasTimeTask(ATTACK_TASK)) {
      bot.createTimeTask(
        ATTACK_TASK, 
        attack, 
        getInterval);
    }
    bot.baseInfo(pluginName, 'Started AutoAttack');
  }

  bot.stopAutoAttack = () => {
    bot.removeTimeTask(ATTACK_TASK);
    bot.baseInfo(pluginName, 'Stopped AutoAttack');
  }

  pluginReady(bot, pluginName);
}

declare module 'mineflayer' {
  interface Bot {
    startAutoAttack(): void;
    stopAutoAttack(): void;
  }
}

interface Config {
  interval: number;
  attackMode: 'whitelist' | 'blacklist';
  attackList: string[];
}