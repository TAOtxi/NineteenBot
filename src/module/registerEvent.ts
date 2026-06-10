import mineflayer from 'mineflayer';
import ChatMessageLoader, { type ChatMessage } from "prismarine-chat";
import { type Window } from 'prismarine-windows'
import { recreateBot } from "./botManager.js";

let ChatMessageClass: ChatMessage;

function getAnsi(message: string | Object) {
  if (typeof message === 'string') {
    return message;
  }
  // @ts-ignore
  return ChatMessageClass.fromNotch(message).toAnsi();
}

function registEvent(bot: mineflayer.Bot) {
  // @ts-ignore
  ChatMessageClass = ChatMessageLoader(bot.registry);
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
    bot.baseInfo('chat', msg.toAnsi());
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

  bot.on('windowOpen', (window: Window) => {
    bot.baseInfo('windowOpen', `Open window: ${getAnsi(window.title)}, windowType: ${window.type}, windowId: ${window.id}`);
  });

  bot.on('windowClose', (window: Window) => {
    if (!window) return;
    bot.baseInfo('windowClose', `Close window: ${getAnsi(window.title)}, windowType: ${window.type}, windowId: ${window.id}`);
  });

  // 修复拾玖世界菜单界面无法正常关闭问题
  bot._client.on('set_slot', (packet) => {
    // 传的 windowId 不为0，但客户端上的 currentWindow 为 null
    if (packet.windowId !== 0 && bot.currentWindow === null) {
      bot._client.write('close_window', { windowId: packet.windowId })
    }
  })
}

export default registEvent;
