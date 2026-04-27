import mineflayer from 'mineflayer';

function waitPluginLoad(bot: mineflayer.Bot, pluginName: string, timeOut: number = 10000) {
  return new Promise((resolve, reject) => {
    let timer: NodeJS.Timeout | null = null;
    if (timeOut >= 0) {
      timer = setTimeout(() => {
        reject(new Error(`Plugin ${pluginName} not loaded within ${timeOut}ms`));
      }, timeOut);
    }

    if (bot.pluginLoadMap?.[pluginName]) {
      timer && clearTimeout(timer);
      resolve(1);
    } else {
      // @ts-ignore
      bot.once(`pluginLoaded_${pluginName}`, () => {
        timer && clearTimeout(timer);
        resolve(1);
      });
    }
    
  })
}

function waitPluginLoads(bot: mineflayer.Bot, pluginName: string | string[], timeOut: number = 10000) {
  if (Array.isArray(pluginName)) {
    return Promise.all(pluginName.map(name => waitPluginLoad(bot, name, timeOut)));
  }
  return waitPluginLoad(bot, pluginName, timeOut);
}

function pluginReady(bot: mineflayer.Bot, pluginName: string) {
  if (!bot.pluginLoadMap) {
    bot.pluginLoadMap = {};
  }
  bot.pluginLoadMap[pluginName] = true;
  // @ts-ignore
  bot.emit(`pluginLoaded_${pluginName}`);
}

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export {
  waitPluginLoads,
  pluginReady,
  wait,
}

declare module 'mineflayer' {
  interface Bot {
    pluginLoadMap: Record<string, boolean>;
  }
}
