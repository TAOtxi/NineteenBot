import mineflayer from 'mineflayer';
import { mineflayer as mineflayerViewer } from 'prismarine-viewer';
import { type ChatMessage } from 'prismarine-chat';
import input from './input.js';
import fixCode from './fix.js';
import TimeUtil from './utils/TimeUtil.js';


const bot = mineflayer.createBot({
  host: '19mc.cn', 
  // port: 25565,
  username: '1321075268@qq.com', 
  auth: 'microsoft', 
  version: '1.21.11',    
  physicsEnabled: false,
})

bot.on('message', (msg: ChatMessage) => {
  console.log(msg.toAnsi());
});

bot.on('physicsTick', () => {
  // TimeUtil.tick(bot);
});

// 呼啦啦
bot.once('spawn', () => {
  setInterval(() => {
    let yaw = bot.entity.yaw + Math.PI / 10;
    bot.look(yaw, 0, true);
  }, 50);  
})

bot.on('spawn', () => {
  // @ts-ignore
  // console.log(bot._getDimensionName());
})

bot.on('resourcePack', (url: string, hash?: string, uuid?: string) => {
  // console.log('Resource pack URL:', url, 'UUID:', uuid);
  bot.acceptResourcePack();
});

// 非常卡的玩意
// bot.once('spawn', () => {
//   mineflayerViewer(bot, { port: 3007, firstPerson: false });
// })

bot.on('kicked', console.log);
bot.on('error', console.log);
fixCode(bot);

console.log('Starting bot...');

export default bot;

