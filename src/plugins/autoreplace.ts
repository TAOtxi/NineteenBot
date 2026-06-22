import mineflayer from 'mineflayer';
import prisItem from 'prismarine-item';
import prismEntity from 'prismarine-entity';
import { pluginReady, waitPluginLoads } from '../utils/pluginWaiter.js';


function shouldAtOffhand(bot: mineflayer.Bot, item: prisItem.Item | null | undefined) {
  if (!item) return false;
  if (item.maxDurability === undefined || item.durabilityUsed === 0) return false;
  if (item.stackSize !== 1) return false;

  if (item.enchants.every(enchant => enchant.name !== 'mending')) return false;
  return bot.registry.itemsByName[item.name]?.enchantCategories?.includes('durability') ?? false;
}


function tryToReplaceMendingEquipment(bot: mineflayer.Bot) {
  if (!bot._autoReplaceEnabled || !bot._autoReplaceThrottle) return;
  if (bot.currentWindow !== null) return;
  bot._autoReplaceThrottle = false;
  bot.createOnceTimeTask(AUTO_REPLACE_THROTTLE_TASK, () => {
    bot._autoReplaceThrottle = true;
  }, 20);

  if (shouldAtOffhand(bot, bot.inventory.slots[45])) return;
  const l = bot.inventory.inventoryStart;
  const r = bot.inventory.inventoryEnd;
  for (let i = l; i < r; i++) {
    if (shouldAtOffhand(bot, bot.inventory.slots[i])) {
      // 交互副手与 i 的位置
      bot.moveSlotItem(i, 45);
      break;
    }
  }
}

function registCmd(bot: mineflayer.Bot) {
  const CM = bot.getCommandManager();
  bot.registerCmd(CM.command([pluginName, 'replace'])
    .then(CM.command('on')
      .execute(bot => bot.startAutoReplace()))
    .then(CM.command('off')
      .execute(bot => bot.stopAutoReplace()))
  );
}

const AUTO_REPLACE_THROTTLE_TASK = 'autoReplaceThrottle';
const pluginName = 'autoreplace';

export default async function inject(bot: mineflayer.Bot) {
  await waitPluginLoads(bot, ['logger', 'command', 'task']);

  bot._autoReplaceEnabled = false;
  bot._autoReplaceThrottle = true;
  
  bot.startAutoReplace = () => {
    if (bot._autoReplaceEnabled) return;
    bot._autoReplaceEnabled = true;
    bot._autoReplaceThrottle = true;
    bot.baseInfo(pluginName, 'Enable AutoReplace.');
    bot.on('playerCollect', onExperienceChange);
  };
  bot.stopAutoReplace = cleanup;

  const experienceOrbId = bot.registry.entitiesByName['experience_orb']?.id;

  function onExperienceChange(player: prismEntity.Entity, item: prismEntity.Entity) {
    if (player.username !== bot.username) return;
    if (item.entityType === experienceOrbId) {
      tryToReplaceMendingEquipment(bot);
    }
  }

  function cleanup() {
    bot._autoReplaceEnabled = false;
    bot._autoReplaceThrottle = true;
    bot.off('playerCollect', onExperienceChange);
  }

  registCmd(bot);
  bot.once('cleanup', cleanup);
  
  pluginReady(bot, pluginName);
}


declare module 'mineflayer' {
  interface Bot {
    _autoReplaceEnabled: boolean;
    _autoReplaceThrottle: boolean;
    startAutoReplace(): void;
    stopAutoReplace(): void;
  }
}
