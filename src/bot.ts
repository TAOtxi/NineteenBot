import mineflayer from "mineflayer";
import { mineflayer as mineflayerViewer } from "prismarine-viewer";
import { type ChatMessage } from "prismarine-chat";
import fixCode from "./fix.js";
import TimeUtil from "./utils/TimeUtil.js";
import setInput from "./input.js";

let bot: mineflayer.Bot;
let currentUser: { username: string, password: string };
let reconnectDelay = 1000;

/************** Action ***************/
let spinTimer = 0;
let watchLatestPlayer = false;
let sneakSometime = false;

function createBot(user: { username: string, password: string }) {
  if (bot) {
    bot.removeAllListeners();
  }
  currentUser = user;
  bot = mineflayer.createBot({
    host: "19mc.cn",
    // port: 25565,
    username: user.username,
    auth: "microsoft",
    version: "1.21.11",
    physicsEnabled: false,
  });
  fixCode(bot);
  setInput(bot);
  handleEvent(bot);
}

function handleEvent(bot: mineflayer.Bot) {
  if (!bot) {
    return;
  }
  bot.on("message", (msg: ChatMessage) => {
    console.log(msg.toAnsi());
  });
  bot.on("physicsTick", () => {
    TimeUtil.tick(bot);
  });
  // 呼啦啦转圈圈
  bot.once("spawn", () => {
    setInterval(() => {
      let yaw = bot.entity.yaw + Math.PI / 10
      bot.look(yaw, 0, true);
    }, 20);
  });
  // bot.on("spawn", () => {
  //   // @ts-ignore
  //   console.log(bot._getDimensionName());
  // });
  bot.on("resourcePack", (url: string, hash?: string, uuid?: string) => {
    // console.log('Resource pack URL:', url, 'UUID:', uuid);
    bot.acceptResourcePack();
  });

  // 非常卡的玩意
  // bot.once('spawn', () => {
  //   mineflayerViewer(bot, { port: 3007, firstPerson: false });
  // });
  bot.on("kicked", console.log);
  bot.on("error", (err: Error) => {
    console.log('[Error]', err);
    setTimeout(() => {
      reconnect();
    }, reconnectDelay);
  });
  bot.on('end', (reason: string) => {
    console.log('[End]', reason);
    setTimeout(() => {
      reconnect();
    }, reconnectDelay);
  });
}

function reconnect() {
  if (!currentUser) {
    console.error('currentUser is undefined');
    return;
  }
  console.log('[Reconnect]', currentUser.username);
  createBot(currentUser);
}

export default {
  createBot,
  reconnect,
}
