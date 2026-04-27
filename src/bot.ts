import mineflayer from "mineflayer";
import { type ChatMessage } from "prismarine-chat";
import { waitPluginLoads } from "./utils/pluginWaiter.js";

import CommandPlugin from "./plugins/command.js";
import AutoDropPlugin from "./plugins/autodrop.js";
import makeConfigPlugin from "./plugins/makeConfig.js";
import loggerPlugin from "./plugins/logger.js";
import helperPlugin from "./plugins/helper.js";
import timePlugin from "./plugins/time.js";

let bot: mineflayer.Bot;
let currentUser: UserConfig;
let currentServer: ServerConfig;
const admin = ['TAOtxi'];

const reconnectDelay = 10000;


async function createBot(
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

  bot.loadPlugins([loggerPlugin, makeConfigPlugin, AutoDropPlugin, CommandPlugin, helperPlugin, timePlugin]);
  await waitPluginLoads(bot, ['logger', 'helper', 'time']);
  
  handleEvent(bot);
  bot.startMonitorInput();
}

function handleEvent(bot: mineflayer.Bot) {
  bot.on('whisper', (username: string, message: string) => {
    if (admin.includes(username)) {
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
