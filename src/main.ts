import NineteenBot from './bot.js'
import fs from 'fs'


function main() {
  const account = JSON.parse(fs.readFileSync('./config/account.json').toString());
  
  const username = 'TAOtxi';
  if (account[username]) {
    console.log(`Login as ${username}`);
    NineteenBot.createBot(account[username]);
  }
}

main();