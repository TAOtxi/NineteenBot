import mineflayer from "mineflayer";
import { type ChatMessage } from "prismarine-chat";
import { waitPluginLoads } from "./utils/pluginWaiter.js";

import CommandPlugin from "./plugins/command.js";
import AutoDropPlugin from "./plugins/autodrop.js";
import makeConfigPlugin from "./plugins/makeConfig.js";
import loggerPlugin from "./plugins/logger.js";
import helperPlugin from "./plugins/helper.js";
import taskPlugin from "./plugins/task.js";
import infomationPlugin from "./plugins/infomation.js";
import actionPlugin from "./plugins/action.js";
import fishmanPlugin from "./plugins/fishman.js";

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

  bot.loadPlugins([
    loggerPlugin, makeConfigPlugin, AutoDropPlugin, 
    CommandPlugin, helperPlugin, taskPlugin, 
    infomationPlugin, actionPlugin, fishmanPlugin
  ]);
  bot.on("resourcePack", (url: string, hash?: string, uuid?: string) => {
    bot.acceptResourcePack();
  });
  await waitPluginLoads(bot, ['logger', 'helper', 'task']);
  
  handleEvent(bot);
  registSomeCommand(bot);

  bot.once('spawn', () => {
    bot.chat("/stp survival");
    bot.createTimeTask('aliveFix', 40, () => {
      // @ts-ignore
      bot.isAlive = true;
    });
  });

  bot.startMonitorInput();
}

function handleEvent(bot: mineflayer.Bot) {
  bot.on('whisper', (username: string, message: string) => {
    if (admin.includes(username)) {
      message = message.trim();
      if (message.match(/^c |^chat /)) {
        bot.chat(message.replace(/^c |^chat /, ''));
      } else {
        bot.tryExecute(message);
      }
    }
   });
  bot.on("message", (msg: ChatMessage) => {
    bot.baseInfo('chat', msg.toAnsi() + "\x1b[0m");
  });
  // bot.on("login", () => {
  //   bot.baseInfo('login', `Login as ${bot.username}`);
  // })
  // bot.on("resourcePack", (url: string, hash?: string, uuid?: string) => {
  //   bot.baseInfo('resourcePack', `Resource pack URL: ${url} UUID: ${uuid} Hash: ${hash}`);
  //   bot.acceptResourcePack();
  // });

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

// TODO: 使用静态方法输出日志
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

function registSomeCommand(bot: mineflayer.Bot) {
  const CommandManager = bot.getCommandManager();
  
  // 清屏
  bot.registerCmd(CommandManager.command(['cls', 'clear'])
    .execute(bot => {
      console.clear();
    }));

  bot.registerCmd(CommandManager.command('quit')
    .execute(bot => {
      bot.stopMonitorInput();
      bot.end('Bye bye...');
    }));

  // TODO: 完善help命令
  bot.registerCmd(CommandManager.command('help')
    .execute(bot => {
      // console.clear();
    }));

  bot.registerCmd(CommandManager.command(['message', 'msg', 'chat'])
    .then(CommandManager.value('<Message or Command>')
      .execute((bot, value) => {
        value && bot.chat(value);
      }))
  );

  bot.registerCmd(CommandManager.command('state')
    .then(CommandManager.command('enablePhysics')
      .execute(bot => bot.physicsEnabled = true))
    .then(CommandManager.command('getYawPitch')
      .execute(bot => bot.baseInfo('state', JSON.stringify(bot.getNotchYawPitch()))))
    .then(CommandManager.command('get')
      .then(CommandManager.value('<Key>')
      .execute((bot, key) => {
        // @ts-ignore
        bot.baseInfo('state', `${key}: ${JSON.stringify(bot[key], null, 2)}`);
      })))
  );
}


  
export default {
  createBot,
  reconnect,
}
