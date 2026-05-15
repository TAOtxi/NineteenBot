import mineflayer from "mineflayer";
import fs from "fs";
import { select } from '@inquirer/prompts';
import { type ChatMessage } from "prismarine-chat";
import { waitPluginLoads } from "../utils/pluginWaiter.js";

import CommandPlugin from "../plugins/command.js";
import AutoDropPlugin from "../plugins/autodrop.js";
import makeConfigPlugin from "../plugins/makeConfig.js";
import loggerPlugin from "../plugins/logger.js";
import helperPlugin from "../plugins/helper.js";
import taskPlugin from "../plugins/task.js";
import infomationPlugin from "../plugins/infomation.js";
import actionPlugin from "../plugins/action.js";
import fishmanPlugin from "../plugins/fishman.js";


const botMap: Record<string, mineflayer.Bot> = {};
let baseConfig = JSON.parse(fs.readFileSync("./config/config.json", 'utf-8')) as UserConfig;
let currentBot: string | null = null;

function isBotExsit(identifier: string | null) {
  if (!identifier) {
    return false;
  }
  return botMap[identifier] !== undefined;
}

function removeBot(identifier: string) {
  if (!isBotExsit(identifier)) {
    console.error('Bot is not exist');
    return;
  }
  const bot = botMap[identifier]!;
  bot.emit('cleanup');
  bot.end('Bye bye...');
  bot.removeAllListeners();
  delete botMap[identifier];
}

function query(message: string, choices: Record<string, string> | string[]) {
  if (Array.isArray(choices)) {
    return select({
      message,
      choices
    })
  }
  return select({
    message,
    choices: Object.keys(choices).map(name => ({
      name: name,
      value: name,
      description: choices[name] || '',
    })),
  })
}

function registCmd(bot: mineflayer.Bot) {
  const CommandManager = bot.getCommandManager();
  bot.registerCmd(CommandManager.command('bot')
    .then(CommandManager.command('create')
      .execute(async bot => {
        bot.baseInfo('BOT', '==============================');
        bot.baseInfo('BOT', '|     Start to create bot    |');
        bot.baseInfo('BOT', '==============================');
        bot.emit('hidden');
        const isCancel = await createBotWithConfig();
        if (isCancel) {
          console.info(`\nCancel create bot. Turn back to ${bot.identifier}\n`);
          bot.emit('display');
        }
      }))
    .then(CommandManager.command('change')
      .then(CommandManager.value('<identifier>')
        .suggests(() => Object.keys(botMap).filter(name => name !== currentBot))
        .execute((bot, identifier) => changeBot(identifier))))
  );

  bot.registerCmd(CommandManager.command(['cls', 'clear'])
    .execute(bot => {
      console.clear();
    }));

  bot.registerCmd(CommandManager.command('quit')
    .execute(bot => {
      bot.baseInfo('BOT', 'Quit');
      removeBot(bot.identifier);

      const bots = Object.keys(botMap);
      if (bots.length === 0) {
        process.exit(0);
      } else {
        currentBot = null;
        changeBot(bots[0]!);
      }
    }));

  bot.registerCmd(CommandManager.command('exit')
    .execute(bot => {
      for (const identifier in botMap) {
        removeBot(identifier);
      }
      process.exit(0);
    }));

  // TODO: 完善help命令
  bot.registerCmd(CommandManager.command('help')
    .execute(bot => {
      // console.clear();
    }));

  bot.registerCmd(CommandManager.command(['msg', 'chat', '.'])
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
      .then(CommandManager.value('<property>')
      .execute((bot, property) => {
        // @ts-ignore
        bot.baseInfo('state', `${property}: ${JSON.stringify(bot[property], null, 2)}`);
      })))
  );

}

function changeBot(identifier: string) {
  if (currentBot === identifier) {
    console.warn(`\n${identifier} is already current bot.\n`);
    return;
  }
  if (!isBotExsit(identifier)) {
    console.error(`\n${identifier} is not exist.\n`);
    return;
  }

  if (currentBot) {
    botMap[currentBot]!.emit('hidden');
  }

  // TODO: 修改成日志输出方式
  console.log(`\nSwitch to bot ${identifier}\n`);

  currentBot = identifier;
  botMap[identifier]!.emit('display');
  return botMap[identifier]!;
}

async function getSelectConfig() {
  let username: string, servername: string;
  const accountList = Object.keys(baseConfig.Users).reduce(
    (prev, username) => {
        prev[username] = baseConfig.Users[username]!.account;
        return prev;
      }, {} as Record<string, string>);
  accountList['Cancel'] = 'Cancel current operation.';
  
  const serverList = Object.keys(baseConfig.Servers).reduce(
    (prev, cur) => {
        prev[cur] = `${baseConfig.Servers[cur]!.host}:${baseConfig.Servers[cur]!.port || 25565}`;
        return prev;
      }, {} as Record<string, string>);
  serverList['Cancel'] = 'Cancel current operation.';

  while (true) {
    username = await query(
      'Select your account', 
      accountList
    );

    if (username === 'Cancel') {
      return { username: '', servername: '' };
    }

    servername = await query(
      'Select the server', 
      serverList
    );

    if (servername === 'Cancel') {
      return { username: '', servername: '' };
    }

    if (isBotExsit(`${username}@${servername}`)) {
      console.error('\nBot is already exist.\n');
      continue;
    }

    break;
  }
  return { username, servername };
}

function createBot(username: string, servername: string) {
  const userConfig = baseConfig.Users[username]!;
  const serverConfig = baseConfig.Servers[servername]!;

  const bot = mineflayer.createBot({
    host: serverConfig.host ?? 'localhost',
    port: serverConfig.port ?? 25565,
    username: userConfig.account,
    auth: serverConfig.auth ?? 'microsoft',
    version: serverConfig.version,
    hideErrors: true,
    logErrors: false,
  });

  // 直接手动赋值，不然还需要等 login 事件
  bot.username = username;
  bot.servername = servername;
  bot.identifier = `${username}@${servername}`;
  
  // currentBot = bot.identifier;
  botMap[bot.identifier] = bot;
  return bot;
}

async function initBot(bot: mineflayer.Bot) {
  await loadPlugins(bot);

  registCmd(bot);
  registEvent(bot);
  bot.once('login', () => {
    bot.identifier === currentBot && bot.emit('display');
  });

  bot.on('spawn', () => {
    // @ts-ignore
    // bot.baseInfo('bot', 'Spawned');
    // bot.isAlive = true;
  })
}

async function loadPlugins(bot: mineflayer.Bot) {
  bot.loadPlugins([
      loggerPlugin, makeConfigPlugin, AutoDropPlugin, 
      CommandPlugin, helperPlugin, taskPlugin, 
      infomationPlugin, actionPlugin, fishmanPlugin
  ]);
  return waitPluginLoads(bot, ['logger', 'helper', 'task']);
}

function registEvent(bot: mineflayer.Bot) {
  bot.on('whisper', (username: string, message: string) => {
    if (!baseConfig.Admin.includes(username)) return;

    message = message.trim();
    if (message.startsWith('/')) {
      bot.chat(message);
    } else if (message.match(/^c |^chat /)) {
      bot.chat(message.replace(/^c |^chat /, ''));
    } else {
      bot.tryExecute(message);
    }
  });

  bot.on("message", (msg: ChatMessage) => {
    bot.baseInfo('chat', msg.toAnsi() + "\x1b[0m");
  });

  bot.once("login", () => {
    bot.baseInfo('login', `Login as ${bot.username}`);
  })

  bot.on("resourcePack", (url: string, hash?: string, uuid?: string) => {
    bot.baseInfo('resourcePack', `Resource pack URL: ${url} UUID: ${uuid} Hash: ${hash}`);
    bot.acceptResourcePack();
  });

  bot.on("kicked", (reason: string) => {
    bot.baseError('kicked', `Kicked: ${JSON.stringify(reason, null, 2)}`);
    recreateBot(bot.identifier);
  });

  bot.on("error", (err: Error) => {
    bot.baseError('error event', err.message);
    recreateBot(bot.identifier);
  });

  bot.on('end', (reason: string) => {
    bot.baseError('end', reason);
    recreateBot(bot.identifier);
  });
}

const timerMap: Record<string, NodeJS.Timeout | null> = {};
const DELAY = 10000;

function recreateBot(identifier: string) {
  timerMap[identifier] && clearTimeout(timerMap[identifier]);
  timerMap[identifier] = setTimeout(async () => {
    timerMap[identifier] = null;
    const bot = botMap[identifier];
    if (!bot) {
      console.error('Bot is not exist');
      return;
    }
    bot.emit('hidden');
    bot.emit('cleanup');
    bot.end('ohoh');
    
    bot.removeAllListeners();
    botMap[identifier] = createBot(
      bot.username, 
      bot.servername  // TODO: 检测 end 事件后 bot 的属性是否存在
    );
    initBot(botMap[identifier]!);
  }, DELAY);
}

async function createBotWithConfig() {
  const { username, servername } = await getSelectConfig();
  if (username === '' || servername === '') {
    return true;
  }
  const bot = createBot(username, servername);
  botMap[bot.identifier] = bot;
  currentBot = bot.identifier;
  initBot(bot);
  return false;
}

export {
  createBotWithConfig,
}

declare module 'mineflayer' {
  interface Bot {
    servername: string;
    identifier: string;
  }

  interface BotEvents {
    cleanup(): void;
    hidden(): void;
    display(): void;
  }
}



interface UserConfig {
  Users: Record<string, {
    account: string;
  }>,

  Servers: Record<string, {
    host?: string,
    port?: number,
    version: string,
    auth?: 'microsoft' | 'mojang' | 'offline'
  }>,

  Admin: string[]
}
