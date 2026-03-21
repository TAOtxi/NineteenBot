import fs from "fs";
import readline from "readline";
import NineteenBot from "./bot.js";
import Logger from "./utils/Logger.js";

const logger = Logger.getLogger("Main");
let user : UserConfig;
let server : ServerConfig;


function main() {
  const config = JSON.parse(fs.readFileSync("./config/config.json").toString());

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  selectAccount(rl, config);
}

function selectAccount(rl: readline.Interface, accountConfig: AccountConfig) {
  const names = Object.keys(accountConfig.Users);
  logger.info("Account list: ");

  names.forEach((name, index) => {
    logger.info(`${index + 1}. ${name}\t${accountConfig.Users[name]!.username}`);
  });

  logger.info("");
  logger.info("Please select your account: ");
  rl.question("", (selectedUser) => {
    const index = selectedUser.trim() === "" ? 0 : parseInt(selectedUser) - 1;
    
    if (!names[index]) {
      logger.error("Invalid account.");
      rl.close();
      return;
    }
    logger.info(`You selected ${names[index]}`);
    user = accountConfig.Users[names[index]]!;

    selectServer(rl, accountConfig);
  });
}

function selectServer(rl: readline.Interface, accountConfig: AccountConfig) {
  const serverNames = Object.keys(accountConfig.Servers);
  logger.info("Server list: ");
  serverNames.forEach((name, index) => {
    logger.info(`${index + 1}. ${name}\t${accountConfig.Servers[name]!.host}:${accountConfig.Servers[name]!.port || 25565}`);
  });
  
  logger.info("");
  logger.info("Please select the server: ");
  rl.question("", (selectedServer) => {
    const index = selectedServer.trim() === "" ? 0 : parseInt(selectedServer) - 1;
    if (!serverNames[index]) {
      logger.error("Invalid server.");
      rl.close();
      return;
    }
    
    rl.close();
    logger.info(`You selected ${serverNames[index]}`);
    server = accountConfig.Servers[serverNames[index]]!;
    
    NineteenBot.createBot(user, server);
  });
}

console.log(process.argv);
main();
