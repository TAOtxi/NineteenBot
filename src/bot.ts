import mineflayer from "mineflayer";
import { type ChatMessage } from "prismarine-chat";
import botAction from "./behavior/action.js";
import TimeUtil from "./utils/TimeUtil.js";
import InputHandler from "./input.js";
import Logger from "./utils/Logger.js";
import AutoDrop from "./module/AutoDrop/main.js";

let bot: mineflayer.Bot;
let currentUser: UserConfig;
let currentServer: ServerConfig;
const admin = ['TAOtxi'];


let reconnectDelay = 10000;
const logger = Logger.getLogger('Bot');


function createBot(
    user: UserConfig, 
    server: ServerConfig
  ) {
    currentUser = user;
    currentServer = server;
    
  // TODO: 添加更多的配置选项
  bot = mineflayer.createBot({
    host: server.host,
    port: server.port ?? 25565,
    username: user.username,
    auth: server.auth ?? 'microsoft',
    version: server.version,
    hideErrors: true,
    logErrors: false,
    // physicsEnabled: true,
  });

  InputHandler.setBot(bot);
  handleEvent(bot);
  botAction.setBot(bot);
  AutoDrop.init(bot);
}

function handleEvent(bot: mineflayer.Bot) {
  if (!bot) {
    return;
  }
  bot.on('whisper', (username: string, message: string) => {
    if (admin.includes(username)) {
      InputHandler.handleInput(message);
    }
   });
  bot.on("message", (msg: ChatMessage) => {
    logger.info(msg.toAnsi() + "\x1b[0m");
  });
  bot.on("physicsTick", () => {
    TimeUtil.tick(bot);
    botAction.tick();
    AutoDrop.tick();
  });
  bot.on("login", () => {
    logger.info(`Login as ${bot.username}`);
  })
  // bot.on("spawn", () => {
  //   bot.physicsEnabled = true;

  //   // @ts-ignore
  //   // logger.info(bot._getDimensionName());
  // });
  bot.on("resourcePack", (url: string, hash?: string, uuid?: string) => {
    // logger.info('Resource pack URL:', url, 'UUID:', uuid);
    bot.acceptResourcePack();
  });

  bot.on("kicked", (reason: string) => {
    logger.error(`Kicked: ${JSON.stringify(reason, null, 2)}`);

    setTimeout(() => {
      reconnect();
    }, reconnectDelay);
  });
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
  bot?.removeAllListeners();
  bot?.end('Bye bye...');
  
  logger.info('[Reconnect]', currentUser.username);
  createBot(currentUser, currentServer);
}

export default {
  createBot,
  reconnect,
}
