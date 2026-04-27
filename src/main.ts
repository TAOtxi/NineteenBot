import fs from "fs";
import { select } from '@inquirer/prompts';
import NineteenBot from "./bot.js";

async function main() {
  const config = JSON.parse(fs.readFileSync("./config/config.json").toString());

  const result = {
    user: await select({
      message: 'Select your account',
      choices: Object.keys(config.Users).map(name => ({
        name: name,
        value: name,
        description: config.Users[name].username,
      })),
    }, { signal: AbortSignal.timeout(10000) }).catch(error => {
      return Object.keys(config.Users)[0];
    }),
    server: await select({
      message: 'Select the server',
      choices: Object.keys(config.Servers).map(name => ({
        name: name,
        value: name,
        description: `${config.Servers[name].host}:${config.Servers[name].port || 25565}`,
      })),
    }, { signal: AbortSignal.timeout(10000) }).catch(error => {
      return Object.keys(config.Servers)[0];
    }),
  }
  if (!result.user || !result.server) {
    console.error('User or server was undefined');
    return;
  }
  console.info(result.user, result.server);
  NineteenBot.createBot(config.Users[result.user], config.Servers[result.server]);
}

main();

// process.on('uncaughtException', (error) => {
//   console.error('未捕获的异常:', error);
// });