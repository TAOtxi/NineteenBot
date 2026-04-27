import mineflayer from "mineflayer";
import { type ChatMessage } from "prismarine-chat";
import InputHandler from "./input.js";

import CommandManager from "./plugins/command.js";
import AutoDrop from "./plugins/autodrop.js";
import make_config from "./plugins/makeConfig.js";
import loggerPlugin from "./plugins/logger.js";



let bot: mineflayer.Bot;
let currentUser: UserConfig;
let currentServer: ServerConfig;
const admin = ['TAOtxi'];

const reconnectDelay = 10000;


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

  bot.loadPlugins([loggerPlugin, make_config, AutoDrop, CommandManager]);

  // InputHandler.setBot(bot);
  // handleEvent(bot);
  // botAction.setBot(bot);
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
    bot.baseInfo('chat', msg.toAnsi() + "\x1b[0m");
  });
  bot.on("login", () => {
    bot.baseInfo('login', `Login as ${bot.username}`);
  })
  bot.on("resourcePack", (url: string, hash?: string, uuid?: string) => {
    // logger.info('Resource pack URL:', url, 'UUID:', uuid);
    bot.acceptResourcePack();
  });

  bot.on("kicked", (reason: string) => {
    bot.baseInfo('kicked', `Kicked: ${JSON.stringify(reason, null, 2)}`);

    setTimeout(() => {
      reconnect();
    }, reconnectDelay);
  });
  bot.on("error", (err: Error) => {
    bot.baseInfo('error', err.message);

    setTimeout(() => {
      reconnect();
    }, reconnectDelay);
  });
  bot.on('end', (reason: string) => {
    bot.baseInfo('end', reason);
    setTimeout(() => {
      reconnect();
    }, reconnectDelay);
  });
}

function reconnect() {
  if (!currentUser || !currentServer) {
    bot.baseInfo('reconnect', 'currentUser or currentServer is undefined');
    return;
  }
  bot?.removeAllListeners();
  bot?.end('Bye bye...');
  
  bot.baseInfo('reconnect', `Reconnect ${currentUser.username}`);
  createBot(currentUser, currentServer);
}

export default {
  createBot,
  reconnect,
}
