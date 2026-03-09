import mineflayer from 'mineflayer';

let lastAge = 0;
const calTps: Array<number> = [];

function getTps(bot: mineflayer.Bot) {
  return calTps.filter(tps => tps === 20).length;
}

function tick(bot: mineflayer.Bot) {
  const diff = Math.floor(bot.time.age) - lastAge;
  lastAge = Math.floor(bot.time.age);
  calTps.push(diff);
}

export default { getTps, tick };