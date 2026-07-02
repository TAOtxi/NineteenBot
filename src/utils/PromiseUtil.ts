function once(emitter: any, event: string) {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    emitter.once(event, resolve);
  });
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export {
  once,
  sleep,
}