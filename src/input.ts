import readline from 'readline';
import mineflayer from 'mineflayer';
import NineteenBot from './bot.js';
import botAction from './behavior/action.js';
import entityInfo from './Infomation/entity.js';
import Logger from './utils/Logger.js';

const logger = Logger.getLogger('Input');
let isInit = false;
let rl: readline.Interface;


// 监听用户输入
function startInput() {
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.on('line', (input: string) => {
    if (!bot) {
      logger.error('Bot not set');
      return;
    };
    input = input.trim();

    try {
      if (input === 'list') {
        displayPlayerList(bot.players);
      } 
      
      // quit
      else if (input === 'quit') {
        handleExit();
      } 
      
      // reconnect
      else if (input === 'rc') {
        bot.quit('下线ing................');
        NineteenBot.reconnect();
      }

      else if (input === 'cls' || input === 'clear') {
        console.clear();
      }

      else if (input.startsWith('info ')) {
        handleInfoCmd(input.slice(5).trim());
      }

      // action
      else if (input.startsWith('act')) {
        const action = input.slice(3).trim();
        botAction.handleCmd(action) && logger.info(`Set command: ${action}`);
      }
      
      else if (input.startsWith('/stp ')) {
        botAction.stop();
        bot.physicsEnabled = false;
        handleStpCmd(input);
      }
      
      else {
        handleChat(input);
      }
    } catch (error: any) {
      logger.error(error.message);
    }
  });

  rl.on('SIGINT', () => {
    handleExit();
  });
}


function displayPlayerList(players: Record<string, mineflayer.Player>) {
  const worlds: Record<string, string[]> = {};
  logger.info('=======================================');
  logger.info(`Total Players: ${Object.keys(players).length}`);
  // TODO: 匹配逻辑待优化
  const prefix = /\[(.*?)\]/g
  for (const player of Object.values(players)) {
    // toAnsi ==>  \x1B[0m\x1B[90m[\x1B[38;2;225;249;232m\x1B[1m传送大厅\x1B[90m]\x1B[97mTAOtxi\x1B[0m
    const styleName = player.displayName.toAnsi();
    const prefixEnd = styleName.indexOf(']');
    const worldName = prefixEnd !== -1 ? styleName.substring(0, prefixEnd + 1) : 'unknown';
    if (worlds[worldName] === undefined) {
      worlds[worldName] = [];
    }
    worlds[worldName].push(player.username);
  }
  for (const world of Object.keys(worlds)) {
    if (!worlds[world]) continue;
    logger.info(`${world}\x1b[0m ${worlds[world].join(', ')}`);
  }
  logger.info('\x1b[0m=======================================');
}

function handleInfoCmd(cmd: string) {
  if (cmd === 'entity') {
    console.log(bot.entities);
  } else if (cmd === 'count') {
    entityInfo.outputEntityCount(bot);
  // } else if (cmd === 'meta') {
  //   logger.info(JSON.stringify(bot.entity.metadata, null, 2));
  } else if (cmd === 'inv') {
    for (const item of bot.inventory.items()) {
      console.log(item);
    }
  }
}

function handleChat(input: string) {
  if (input.startsWith('. ')) {
    bot.chat(input.slice(2)); // chat message --- >> . Hello ~
  } else if (input.startsWith('/')) {
    bot.chat(input);          // command      --- >> /pay TAOtxi 666666
  }
}

function handleStpCmd(input: string) {
  const target = input.slice(5).trim();
  const serverList = ['survival', 'survival2', 'industry', 'lobby'];
  if (serverList.includes(target)) {
    botAction.stop();
    bot.physicsEnabled = false;
    bot.chat(input);
  }
}

function handleExit() {
  bot.quit("下线ing................");
  rl?.close();
  process.exit(0);
}

let bot: mineflayer.Bot;

export default function (botInstance: mineflayer.Bot, logToFile: boolean) {
  bot = botInstance;

  if (!isInit) {
    logger.setLogToFile(logToFile);
    entityInfo.setLogToFile(logToFile);
    isInit = true;
    startInput();
  }
}