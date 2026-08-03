import mineflayer from 'mineflayer';

function once(emitter: any, event: string) {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    emitter.once(event, resolve);
  });
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function awaitEvent(bot: mineflayer.Bot, event: string, timeout: number = 20000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      bot.off('cleanup', oncleanup);
      // @ts-ignore
      bot.off(event, onEvent);
      reject(new Error(`Event ${event} timeout ${timeout}ms`));
    }, timeout);

    function oncleanup() {
      clearTimeout(timer);
      // @ts-ignore
      bot.off(event, onEvent);
      bot.closeContainer();
    }

    function onEvent() {
      clearTimeout(timer);
      bot.off('cleanup', oncleanup);
      resolve();
    }

    bot.once('cleanup', oncleanup);
    
    // @ts-ignore
    bot.once(event, onEvent);
  })
}

export {
  once,
  sleep,
  awaitEvent,
}