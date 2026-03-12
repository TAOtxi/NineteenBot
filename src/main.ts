import fs from "fs";
import readline from "readline";
import NineteenBot from "./bot.js";
import Logger from "./utils/Logger.js";

const logger = Logger.getLogger("Main");

function main() {
  const config = JSON.parse(fs.readFileSync("./config/config.json").toString());
  const users = config.Users;
  const servers = config.Servers;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  logger.info("Account list: ");
  const names = Object.keys(users);
  names.forEach((name, index) => {
    logger.info(`${index + 1}. ${name}\t(${users[name].username})`);
  });
  
  logger.info("Please select your account: ");
  rl.question("", (selectedUser) => {
    const selectedUserIndex = parseInt(selectedUser) - 1;
    if (!names[selectedUserIndex]) {
      logger.error("Invalid account.");
      rl.close();
      return;
    }
    logger.info(`You selected ${names[selectedUserIndex]}`);

    const serverNames = Object.keys(servers);
    logger.info("Server list: ");
    serverNames.forEach((name, index) => {
      logger.info(`${index + 1}. ${name}\t(${servers[name].host}:${servers[name].port || 25565})`);
    });
    
    logger.info("Please select the server: ");
    rl.question("", (selectedServer) => {
      const selectedServerIndex = parseInt(selectedServer) - 1;
      if (!names[selectedUserIndex] || !serverNames[selectedServerIndex]) {
        logger.error("Invalid server.");
        rl.close();
        return;
      }
      
      rl.close();
      logger.info(`You selected ${serverNames[selectedServerIndex]}`);
      logger.info(`Connecting to ${servers[serverNames[selectedServerIndex]].host}:${servers[serverNames[selectedServerIndex]].port || 25565}`);
      NineteenBot.createBot(users[names[selectedUserIndex]], servers[serverNames[selectedServerIndex]]);
    });

  });
}

main()
