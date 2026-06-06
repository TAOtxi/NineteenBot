import mineflayer from 'mineflayer';
import { type ChatMessage } from "prismarine-chat";
import { recreateBot } from "./botManager.js";

function registEvent(bot: mineflayer.Bot) {
  bot.on('whisper', (username: string, message: string) => {
    if (!bot.admins.includes(username)) return;

    message = message.trim();
    if (message.startsWith('/')) {
      bot.chat(message);
    } else if (message.match(/^c |^chat /)) {
      bot.chat(message.replace(/^c |^chat /, ''));
    } else {
      bot.tryExecute(message);
    }
  });

  bot.on("message", (msg: ChatMessage) => {
    // bot.withoutLogTitle().baseInfo('chat', JSON.stringify(msg, null, 2));
    bot.baseInfo('chat', msg.toAnsi() + "\x1b[0m");
  });

  bot.once("login", () => {
    bot.baseInfo('login', `Login as ${bot.username}`);
  })

  bot.on("resourcePack", (url: string, hash?: string, uuid?: string) => {
    bot.baseInfo('resourcePack', `Resource pack URL: ${url} UUID: ${uuid} Hash: ${hash}`);
    bot.acceptResourcePack();
  });

  bot.on("kicked", (reason: string) => {
    bot.baseError('kicked', `Kicked: ${JSON.stringify(reason, null, 2)}`);
    recreateBot(bot.identifier);
  });

  bot.on("error", (err: Error) => {
    bot.baseError('error event', err.message);
    // console.trace(err);
    recreateBot(bot.identifier);
  });

  bot.on('end', (reason: string) => {
    bot.baseError('end', reason);
    recreateBot(bot.identifier);
  });
}

export default registEvent;
