import mineflayer from "mineflayer";
import { mineflayer as mineflayerViewer } from "prismarine-viewer";
import { type ChatMessage } from "prismarine-chat";
import botAction from "./behavior/action.js";
import fixCode from "./fix.js";
import TimeUtil from "./utils/TimeUtil.js";
import setInput from "./input.js";
import Logger from "./utils/Logger.js";

let bot: mineflayer.Bot;
let currentUser: { username: string, password: string };
let reconnectDelay = 1000;
const logger = Logger.getLogger('Bot');


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
  botAction.setBot(bot);
}

function handleEvent(bot: mineflayer.Bot) {
  if (!bot) {
    return;
  }
  bot.on("message", (msg: ChatMessage) => {
    logger.info(msg.toAnsi() + "\x1b[0m");
  });
  bot.on("physicsTick", () => {
    TimeUtil.tick(bot);
    botAction.tick();
  });
  // bot.on("spawn", () => {
  //   // @ts-ignore
  //   logger.info(bot._getDimensionName());
  // });
  bot.on("resourcePack", (url: string, hash?: string, uuid?: string) => {
    // logger.info('Resource pack URL:', url, 'UUID:', uuid);
    bot.acceptResourcePack();
  });

  bot.on("kicked", logger.error);
  bot.on("error", (err: Error) => {
    logger.error(err.message);

    setTimeout(() => {
      reconnect();
    }, reconnectDelay);
  });
  bot.on('end', (reason: string) => {
    logger.info('[End]', reason);
    setTimeout(() => {
      reconnect();
    }, reconnectDelay);
  });
}

function reconnect() {
  if (!currentUser) {
    logger.error('currentUser is undefined');
    return;
  }
  logger.info('[Reconnect]', currentUser.username);
  createBot(currentUser);
}

export default {
  createBot,
  reconnect,
}
