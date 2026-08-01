import mineflayer from 'mineflayer';
import ChatMessageLoader, { type ChatMessage } from "prismarine-chat";
import { type Window } from 'prismarine-windows'
import { recreateBot } from "@/module/botManager.js";

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

  bot.once("login", () => {
    bot.baseInfo(`--> ${bot.identifier} logged in`, true);
  })

  bot.on("resourcePack", (url: string, hash?: string) => {
    bot.baseInfo('resourcePack', `ResourcePack URL: ${url}, Hash: ${hash}`);
    bot.acceptResourcePack();
  });

  bot.on("kicked", (reason: string) => {
    bot.baseError('kicked', `Was kicked: ${JSON.stringify(reason, null, 2)}`);
    recreateBot(bot.identifier);
  });

  bot.on("error", (err: Error) => {
    bot.baseError('ErrorEvent', err.message);
    // console.trace(err);
    recreateBot(bot.identifier);
  });

  bot.on('end', (reason: string) => {
    bot.baseError('end', reason);
    recreateBot(bot.identifier);
  });

  bot.on('windowOpen', (window: Window) => {
    // bot.baseInfo('windowOpen', `Open window: ${getAnsi(window.title)}, windowType: ${window.type}, windowId: ${window.id}`);
  });

  bot.on('windowClose', (window: Window) => {
    if (!window) return;
    // bot.baseInfo('windowClose', `Close window: ${getAnsi(window.title)}, windowType: ${window.type}, windowId: ${window.id}`);
  });

  // TODO: 用一个变量记录上一次打开的容器id，当新的容器id发来时，
  //       但上一次容器未主动关闭或未接收到服务器关闭容器的数据包，则自动关闭上一次容器。
  // 修复拾玖世界菜单界面无法正常关闭问题
  bot._client.on('set_slot', (packet) => {
    // 传的 windowId 不为0，但客户端上的 currentWindow 为 null
    if (packet.windowId !== 0 && bot.currentWindow === null) {
      // bot.baseInfo('FIX', `Invalid windowId: ${packet.windowId}, close it.`);
      bot._client.write('close_window', { windowId: packet.windowId })
    }
  })

  bot.hasDeath = false;
  bot.on('spawn', () => {
    if (bot.hasDeath) {
      bot.chat('/back');
    }
  });

  bot.once('death', () => {
    bot.hasDeath = true;
  });

  bot.on('playerJoin', (playerName) => {
    bot.baseInfo(`\x1b[32m+ ${playerName}\x1b[0m`);
  });

  bot.on('playerLeave', (playerName) => {
    bot.baseInfo(`\x1b[31m- ${playerName}\x1b[0m`);
  });
}

declare module 'mineflayer' {
  interface Bot {
    hasDeath: boolean;
  }
}


export default registEvent;
