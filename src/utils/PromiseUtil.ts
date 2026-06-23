function once(emitter: any, event: string) {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    emitter.once(event, resolve);
  });
}

export {
  once,
}