import mineflayer from "mineflayer";
import { getAccountInfo, getServerInfo } from "@/Config/loadConfig.js";
import { waitPluginLoads } from "@/utils/pluginWaiter.js";
import registCommonCmd from "@/module/command.js";
import registEvent from "@/module/registerEvent.js";
import CommandPlugin from "@/plugins/command.js";
import AutoDropPlugin from "@/plugins/autodrop.js";
import MakeConfigPlugin from "@/plugins/makeConfig.js";
import LoggerPlugin from "@/plugins/logger.js";
import TaskPlugin from "@/plugins/task.js";
import InfomationPlugin from "@/plugins/infomation.js";
import ActionPlugin from "@/plugins/action.js";
import FishmanPlugin from "@/plugins/fishman.js";
import MenuClickPlugin from "@/plugins/menuClick.js";
import ControlPlugin from "@/plugins/control.js";
import AutoRepairPlugin from "@/plugins/autorepair.js";
import AutoReplacePlugin from "@/plugins/autoreplace.js";
import AnvilPlugin from "@/plugins/anvil.js";
import TpsPlugin from "@/plugins/tps.js";
import AutoAttackPlugin from "@/plugins/autoattack.js";
import TpsCheckerPlugin from "@/plugins/tpsChecker.js"; 
import InitTaskPlugin from "@/plugins/initTask.js";
import onMessage from "@/module/onMessage.js";
import test from "@/test/test.js";
import { onBotChange } from "@/panel/createPanel.js";
import createStartScreen from "@/panel/createStartScreen.js";

const noPanel = process.argv.includes('--noPanel');

// { `${username}@${servername}` : Bot }
const botMap: Record<string, mineflayer.Bot> = {};
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
    console.warn(`Bot ${identifier} is not exist.`);
    return;
  }
  const bot = botMap[identifier]!;
  bot.emit('cleanup');
  bot.end('Bye bye...');
  bot.removeAllListeners();
  delete botMap[identifier];
}

function registCmd(bot: mineflayer.Bot) {
  const CommandManager = bot.getCommandManager();
  bot.registerCmd(CommandManager.command('bot')
    .then(CommandManager.command('create')
      .execute(() => createStartScreen()))
    .then(CommandManager.command('change')
      .then(CommandManager.value('<identifier>')
        .suggests(() => Object.keys(botMap).filter(name => name !== currentBot))
        .execute((bot, identifier) => changeBot(identifier))))
  );

  bot.registerCmd(CommandManager.command('quit')
    .execute(bot => {
      bot.baseInfo('BOT', `Quit bot ${bot.identifier}`, true);
      bot.removeAllTasks();
      removeBot(bot.identifier);

      const bots = Object.keys(botMap);
      if (bots.length === 0) {
        process.exit(0);
      } else if (currentBot === bot.identifier) {
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
        bot.baseInfo('BOT', `Execute command "${command}" on all bots.`);
        for (const b of Object.values(botMap)) {
          b?.tryExecute(command);
        }
      }))
  );

  // bot.registerCmd(CommandManager.command('restart')
  //   .execute(bot => {
  //     bot.baseInfo('BOT', `Restart bot ${bot.identifier}`);
  //     recreateBot(bot.identifier);
  //   }));

  registCommonCmd(bot);
  test(bot);
}

function changeBot(identifier: string) {
  if (currentBot === identifier) {
    console.log('', false);
    console.warn(`Bot ${identifier} is already current bot.`);
    console.log('', false);
    return;
  }
  if (!isBotExsit(identifier)) {
    console.warn(`\nBot ${identifier} is not exist.\n`);
    return;
  }

  if (currentBot && isBotExsit(currentBot)) {
    botMap[currentBot]!.emit('hidden');
  }
  const toShowBot = botMap[identifier]!;

  console.log('', false);
  console.info(`Switch to bot ${identifier}`);
  console.log('', false);

  currentBot = identifier;
  toShowBot.emit('display');
  return toShowBot;
}

function createBot(username: string, servername: string) {
  const userConfig = getAccountInfo(username);
  const serverConfig = getServerInfo(servername);

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
  onMessage(bot);

  bot.once('login', () => {
    if (currentBot === null) {
      currentBot = bot.identifier;
    }
    if (bot.identifier === currentBot) {
      bot.emit('display');
      bot.baseInfo('--> Shift + ← 聚焦聊天框，Shift + → 聚焦日志输出');
      bot.baseInfo('--> (Shift / Ctrl) + (↑ / ↓) 滚动窗口数据，shift一次滚动5行,ctrl一次滚动10行');
    }
  });

  bot.on('display', () => {
    bot.isDisplayed = true;

    if (!noPanel) {
      onBotChange(bot);
    }
  });

  bot.on('hidden', () => {
    bot.isDisplayed = false;
  });
}

async function createBotWithInitialize(username: string, servername: string) {
  const bot = createBot(username, servername);
  await initBot(bot);
  return bot;
}

function createBotWithTask(username: string[], servername: string, taskName: string) {
  username.forEach((u, idx) => setTimeout(async () => {
    const bot = await createBotWithInitialize(u, servername);
    bot.addTask(taskName, true);
  }, idx * 10000));
}

async function loadPlugins(bot: mineflayer.Bot) {
  bot.loadPlugins([
      LoggerPlugin, MakeConfigPlugin, AutoDropPlugin, CommandPlugin, 
      TaskPlugin, InfomationPlugin, ActionPlugin, 
      FishmanPlugin, MenuClickPlugin, ControlPlugin, AutoRepairPlugin, 
      AutoReplacePlugin, AnvilPlugin, TpsPlugin, AutoAttackPlugin,
      TpsCheckerPlugin, InitTaskPlugin,
  ]);
  await waitPluginLoads(bot, ['logger', 'task']);
}



const timerMap: Record<string, NodeJS.Timeout | null> = {};
const DELAY = 20000;

function recreateBot(identifier: string) {
  timerMap[identifier] && clearTimeout(timerMap[identifier]);
  timerMap[identifier] = setTimeout(async () => {
    delete timerMap[identifier];
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

export {
  recreateBot,
  createBotWithInitialize,
  createBotWithTask,
  getBotMap,
};

declare module 'mineflayer' {
  interface Bot {
    servername: string;
    identifier: string;
    isDisplayed: boolean;
  }

  interface BotEvents {
    cleanup(): void;
    hidden(): void;
    display(): void;
  }
}
