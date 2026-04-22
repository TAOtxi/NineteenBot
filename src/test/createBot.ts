import mineflayer from "mineflayer";

export default function createBot() {
  return mineflayer.createBot({
    host: 'play.simpfun.cn',
    port: 18393,
    username: 'TAOtxi',
    version: "1.21.11",
    auth: 'microsoft'
  })
}
