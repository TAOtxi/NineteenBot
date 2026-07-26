import blessed from 'blessed';

const screen =  blessed.screen({
  smartCSR: true,
  title: ' ⚡️ NineteenBot ⚡️ ',
  fullUnicode: true,
  key: true,
  mouse: true,
});

export default screen;