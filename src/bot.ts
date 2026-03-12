import mineflayer from "mineflayer";
import { type ChatMessage } from "prismarine-chat";
import botAction from "./behavior/action.js";
import fixCode from "./fix.js";
import TimeUtil from "./utils/TimeUtil.js";
import setInputBot from "./input.js";
import Logger from "./utils/Logger.js";

let bot: mineflayer.Bot;
let currentUser: { username: string };
let currentServer: { host: string, port?: number };

let reconnectDelay = 1000;
const logger = Logger.getLogger('Bot');


function createBot(
    user: { username: string }, 
    server: { host: string, port?: number }
  ) {
  if (bot) {
    bot.removeAllListeners();
  }
  currentUser = user;
  currentServer = server;
  bot = mineflayer.createBot({
    host: server.host,
    port: server.port || 25565,
    username: user.username,
    auth: "microsoft",
    version: "1.21.11",
    // hideErrors: true,
    // logErrors: false,
    physicsEnabled: false,
  });
  fixCode.fix(bot);
  setInputBot(bot);
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
  bot.on("login", () => {
    logger.info(`Login as ${bot.username}`);
  })
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
  if (!currentUser || !currentServer) {
    logger.error('currentUser or currentServer is undefined');
    return;
  }
  logger.info('[Reconnect]', currentUser.username);
  createBot(currentUser, currentServer);
}

export default {
  createBot,
  reconnect,
}
