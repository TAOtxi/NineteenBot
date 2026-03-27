import readline from 'readline';
import mineflayer from 'mineflayer';
import NineteenBot from './bot.js';
import botAction from './behavior/action.js';
import entityInfo from './Infomation/entity.js';
import Logger from './utils/Logger.js';
import CmdParser from './utils/CmdParser.js';
import handleAutoDropCmd from './module/AutoDrop/cmd.js';
import inventoryInfo from './Infomation/inventory.js';
import handleBehaviorCmd from './behavior/behavior.js';


const logger = Logger.getLogger('Input');
let isInit = false;
let rl: readline.Interface;


// 监听用户输入
function startInput() {
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.on('line', handleInput);

  rl.on('SIGINT', () => {
    handleExit();
  });
}


async function handleInput(input: string) {
  if (!bot) {
    logger.error('Bot not set');
    return;
  };
  logger.info('Handle Cmd: ', input);
  input = input.trim();
  const parseCmd = new CmdParser(input);

  try {
    if (parseCmd.isCmd(['ls', 'list'])) {
      displayPlayerList(bot.players);
    } 
    
    // quit
    else if (parseCmd.isCmd(['quit', 'exit'])) {
      handleExit();
    } 
    
    // reconnect
    // else if (parseCmd.isCmd(['rc', 'reconnect'])) {
      // bot.quit('下线ing................');
    //   NineteenBot.reconnect();
    // }

    else if (parseCmd.isCmd(['cls', 'clear'])) {
      console.clear();
    }

    else if (parseCmd.isCmd(['i', 'info'])) {
      handleInfoCmd(parseCmd.dive());
    }

    // action
    else if (parseCmd.isCmd(['ac', 'act', 'action'])) {
      botAction.handleCmd(parseCmd.dive());
    }
    
    else if (parseCmd.isCmd('.') || parseCmd.getFirstCmd()?.startsWith('/')) {
      if (parseCmd.isCmd(['/stp', '/lobby'])) {
        botAction.stop();
      }
      handleChat(parseCmd.getRawCmd().trim());
    }

    /************* MODULE *************/
    else if (parseCmd.isCmd(['ad', 'autodrop'])) {
      handleAutoDropCmd(parseCmd.dive());
    }

    else if (parseCmd.isCmd(['bh', 'behavior'])) {
      handleBehaviorCmd(bot, parseCmd.dive());
    }

  } catch (error: any) {
    logger.error(error.message);
  }
}

function displayPlayerList(players: Record<string, mineflayer.Player>) {
  const worlds: Record<string, string[]> = {};
  logger.withoutPrefix().info('=======================================');
  logger.withoutPrefix().info(`Total Players: ${Object.keys(players).length}`);
  // TODO: 匹配逻辑待优化
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
  const worldList = Object.keys(worlds).sort();
  if (worldList.length === 1 && worldList[0] === 'unknown') {
    logger.withoutPrefix().info(`${worlds[worldList[0]]?.join(', ')}`);
  } else {
    for (const world of worldList) {
      logger.withoutPrefix().info(`${world}\x1b[0m ${worlds[world]!.join(', ')}`);
    }
  }
  logger.withoutPrefix().info('\x1b[0m=======================================');
}

function handleInfoCmd(parseCmd: CmdParser) {
  if (parseCmd.isCmd(['e', 'entity'])) {
    entityInfo(bot, parseCmd.dive());
  } else if (parseCmd.isCmd(['inv', 'inventory'])) {
    inventoryInfo(bot, parseCmd.dive());
  }
}
function handleChat(input: string) {
  if (input.startsWith('. ')) {
    bot.chat(input.slice(2)); // chat message --- >> . Hello ~
  } else if (input.startsWith('/')) {
    bot.chat(input);          // command      --- >> /pay TAOtxi 666666
  }
}

function handleExit() {
  bot.quit("下线ing................");
  rl?.close();
  process.exit(0);
}

let bot: mineflayer.Bot;

export default {
  setBot(botInstance: mineflayer.Bot) {
    bot = botInstance;

    if (!isInit) {
      isInit = true;
      startInput();
    }
  },

  handleInput,
}