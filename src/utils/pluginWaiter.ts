import mineflayer from 'mineflayer';

function waitPluginLoad(bot: mineflayer.Bot, pluginName: string) {
  return new Promise(resolve => {
    if (bot.pluginLoadMap?.[pluginName]) {
      resolve(1);
    } else {
      // @ts-ignore
      bot.once(`pluginLoaded_${pluginName}`, resolve);
    }
  })
}

function waitPluginLoads(bot: mineflayer.Bot, pluginName: string | string[]) {
  if (Array.isArray(pluginName)) {
    return Promise.all(pluginName.map(name => waitPluginLoad(bot, name)));
  }
  return waitPluginLoad(bot, pluginName);
}

function pluginReady(bot: mineflayer.Bot, pluginName: string) {
  if (!bot.pluginLoadMap) {
    bot.pluginLoadMap = {};
  }
  bot.pluginLoadMap[pluginName] = true;
  // @ts-ignore
  bot.emit(`pluginLoaded_${pluginName}`);
}

export {
  waitPluginLoads,
  pluginReady,
}

declare module 'mineflayer' {
  interface Bot {
    pluginLoadMap: Record<string, boolean>;
  }
}
