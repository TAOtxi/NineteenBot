import readline from 'readline';
import mineflayer from 'mineflayer';
import NineteenBot from './bot.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 监听用户输入
rl.on('line', (input: string) => {
  if (!bot) {
    console.log('Bot not set');
    return;
  };
  input = input.trim();
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

  // action
  else if (input === 'act') {
    handleAction();
  }
  
  else if (input.startsWith('/stp ')) {
    handleStpCmd(input);
  } 
  
  else {
    handleChat(input);
  }
});


function displayPlayerList(players: Record<string, mineflayer.Player>) {
  const worlds: Record<string, string[]> = {};
  console.log('=======================================');
  console.log(`Total Players: ${Object.keys(players).length}`);
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
    console.log(`${world} ${worlds[world].join(', ')}`);
  }
  console.log('\x1b[0m=======================================');
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
    bot.physicsEnabled = false;
    bot.chat(input);
  }
}

function handleExit() {
  bot.quit("下线ing................");
  rl.close();
  process.exit(0);
}

function handleAction() {
  
}

let bot: mineflayer.Bot;
export default function (botInstance: mineflayer.Bot) {
  bot = botInstance;
}