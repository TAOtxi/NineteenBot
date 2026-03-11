import NineteenBot from './bot.js'
import fs from 'fs'
import Logger from './utils/Logger.js'

const logger = Logger.getLogger('Main');

function main() {
  const account = JSON.parse(fs.readFileSync('./config/account.json').toString());
  
  const username = 'TAOtxi';
  if (account[username]) {
    logger.info(`Login as ${username}`);
    NineteenBot.createBot(account[username]);
  }
}

main();