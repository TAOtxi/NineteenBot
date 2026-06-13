import mineflayer from "mineflayer";
import fs from "fs";
import { checkbox, select } from '@inquirer/prompts';
import { waitPluginLoads } from "../utils/pluginWaiter.js";
import testCmd from "./test.js";
import registCommonCmd from "./command.js";
import registEvent from "./registerEvent.js";

import CommandPlugin from "../plugins/command.js";
import AutoDropPlugin from "../plugins/autodrop.js";
import makeConfigPlugin from "../plugins/makeConfig.js";
import loggerPlugin from "../plugins/logger.js";
import helperPlugin from "../plugins/helper.js";
import taskPlugin from "../plugins/task.js";
import infomationPlugin from "../plugins/infomation.js";
import actionPlugin from "../plugins/action.js";
import fishmanPlugin from "../plugins/fishman.js";
import menuClickPlugin from "../plugins/menuClick.js";
import controlPlugin from "../plugins/control.js";
import { getTaskMap } from "./applyTask.js";
import onMessage from "./onMessage.js";

// { `${username}@${servername}` : Bot }
const botMap: Record<string, mineflayer.Bot> = {};
const botTaskCache: Record<string, string[]> = {};

const baseConfig = JSON.parse(fs.readFileSync("./config/config.json", 'utf-8')) as UserConfig;
let currentBot: string | null = null;

function getBotMap() {
  return botMap;
}

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

        const task = await select({
          message: 'Select your action:',
          choices: ['Apply task', 'Create bot', 'Cancel'],
        });

        if (task === 'Cancel') {
          console.info(`\nCancel create bot. Turn back to ${bot.identifier}\n`);
          bot.emit('display');
          return;
        }

        if (task === 'Apply task') {
          currentBot = null;
          createBotAndApplyTask();
          return;
        }
        
        if (task !== 'Create bot') {
          throw new Error('Invalid choice');
        }

        const identifier = await createBotWithConfig();
        if (identifier === '') {
          console.info(`\nCancel create bot. Turn back to ${bot.identifier}\n`);
          bot.emit('display');
        } else {
          currentBot = identifier;
        }
      }))
    .then(CommandManager.command('change')
      .then(CommandManager.value('<identifier>')
        .suggests(() => Object.keys(botMap).filter(name => name !== currentBot))
        .execute((bot, identifier) => changeBot(identifier))))
  );

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

  bot.registerCmd(CommandManager.command('all')
    .then(CommandManager.value('<command>')
      .execute((bot, command) => {
        bot.baseInfo('BOT', `Execute command ${command} on all bots.`);
        for (const b of Object.values(botMap)) {
          b?.tryExecute(command);
        }
      }))
  );

  bot.registerCmd(CommandManager.command('restart')
    .execute(bot => {
      bot.baseInfo('BOT', `Restart bot ${bot.identifier}`);
      recreateBot(bot.identifier);
    }));

  registCommonCmd(bot);
  testCmd(bot);
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

async function applyTaskOrCreateBot() {
  const task = await select({
    message: 'Select your action:',
    choices: ['Apply task', 'Create bot'],
  });

  if (task === 'Apply task') {
    createBotAndApplyTask();
  } else if (task === 'Create bot') {
    createBotWithConfig();
  }
}

async function createBotAndApplyTask() {
  const botNameList = Object.keys(baseConfig.Users);

  const bots = await checkbox({
    message: 'Select the bots to create',
    choices: botNameList,
    validate: (val) => val.length > 0,
  });

  const server = await select({
    message: 'Select the server to create',
    choices: Object.keys(baseConfig.Servers),
  });

  const task = await select({
    message: 'Select the task to apply',
    choices: Object.keys(getTaskMap()),
  });

  for (const bot of bots) {
    createBotWithTask(bot, server, task);
  }

  return true;
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

  bot.admins = baseConfig.Admin;
  registCmd(bot);
  registEvent(bot);
  onMessage(bot);

  const taskMap = getTaskMap();
  for (const task of botTaskCache[bot.identifier] || []) {
    if (taskMap[task] === undefined) {
      bot.baseError('BOT', `${task} task is not exist.`);
      continue;
    }
    taskMap[task](bot);
  }

  bot.once('login', () => {
    if (currentBot === null) {
      currentBot = bot.identifier;
      bot.emit('display');
    } else if (bot.identifier === currentBot) {
      bot.emit('display');
    }
  });
}

async function loadPlugins(bot: mineflayer.Bot) {
  bot.loadPlugins([
      loggerPlugin, makeConfigPlugin, AutoDropPlugin, 
      CommandPlugin, helperPlugin, taskPlugin, 
      infomationPlugin, actionPlugin, fishmanPlugin,
      menuClickPlugin, controlPlugin,
  ]);
  return waitPluginLoads(bot, ['logger', 'helper', 'task']);
}



const timerMap: Record<string, NodeJS.Timeout | null> = {};
const DELAY = 20000;

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
    // bot._client.emit('end');
    // bot._client.removeAllListeners();
    
    bot.removeAllListeners();
    createBot(
      bot.username, 
      bot.servername  // TODO: 检测 end 事件后 bot 的属性是否存在
    );
    initBot(botMap[identifier]!);
  }, DELAY);
}

async function createBotWithConfig() {
  const { username, servername } = await getSelectConfig();
  if (username === '' || servername === '') {
    return '';
  }
  const bot = createBot(username, servername);
  initBot(bot);
  return bot.identifier;
}

async function createBotWithTask(username: string, servername: string, task: string) {
  const bot = createBot(username, servername);
  addTask(bot, task);

  initBot(bot);
}

function addTask(bot: mineflayer.Bot, task: string) {
  if (botTaskCache[bot.identifier] === undefined) {
    botTaskCache[bot.identifier] = [];
  }
  if (botTaskCache[bot.identifier]!.includes(task)) {
    return;
  }
  botTaskCache[bot.identifier]!.push(task);
}

function removeTask(bot: mineflayer.Bot, task: string) {
  if (!Array.isArray(botTaskCache[bot.identifier])) {
    bot.baseError('BOT', `${task} task is not exist.`);
    return;
  }

  if (!botTaskCache[bot.identifier]!.includes(task)) {
    bot.baseError('BOT', `${task} task is not exist.`);
    return;
  }
  bot.baseInfo('BOT', `Remove task ${task}.`);
  botTaskCache[bot.identifier] = botTaskCache[bot.identifier]!.filter(t => t !== task);
}

export {
  recreateBot,
  removeTask,
  addTask,
  applyTaskOrCreateBot,
  getBotMap,
};

export type { UserConfig };

declare module 'mineflayer' {
  interface Bot {
    servername: string;
    identifier: string;
    admins: string[];
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
