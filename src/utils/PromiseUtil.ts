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
      reject(new Error(`Event ${event} timeout ${timeout}ms`));
    }, timeout);

    function oncleanup() {
      clearTimeout(timer);
    }

    bot.once('cleanup', oncleanup);

    // @ts-ignore
    bot.once(event, () => {
      clearTimeout(timer);
      bot.off('cleanup', oncleanup);
      resolve();
    });
  })
}

export {
  once,
  sleep,
  awaitEvent,
}