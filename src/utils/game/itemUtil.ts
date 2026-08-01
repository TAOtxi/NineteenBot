import mineflayer from 'mineflayer';
import ChatMessageLoader, { type ChatMessage } from "prismarine-chat";
import prisItem from 'prismarine-item';

const ChatMessageClassMap: Record<string, ChatMessage> = {};
const defaultVersion = '1.21.11';
// @ts-ignore
ChatMessageClassMap[defaultVersion] = ChatMessageLoader(defaultVersion);

type Message = string | Object | null | undefined;

function toAnsi(message: Message, version: string = defaultVersion) {
  if (typeof message === 'string') {
    return message;
  }
  if (message === null || message === undefined) {
    return '';
  }

  if (!ChatMessageClassMap[version]) {
    // @ts-ignore
    ChatMessageClassMap[version] = ChatMessageLoader(version);
  }

  // case: Object
  // @ts-ignore
  return ChatMessageClassMap[version]!.fromNotch(message).toAnsi() + "\x1b[0m";
}

function getAnsi(message: Message): string;
function getAnsi(bot: mineflayer.Bot, message: Message): string;

function getAnsi(botOrMessage: mineflayer.Bot | Message, message?: Message) {
  if (message === undefined) {
    const msg = botOrMessage as Message;
    return toAnsi(msg);
  }

  const bot = botOrMessage as mineflayer.Bot;
  return toAnsi(message, bot.version);
}


function getItemNameWithAnsiColor(item: prisItem.Item): string;
function getItemNameWithAnsiColor(bot: mineflayer.Bot, item: prisItem.Item): string;

function getItemNameWithAnsiColor(botOrItem: mineflayer.Bot | prisItem.Item, item?: prisItem.Item) {
  if (item === undefined) {
    const msg = botOrItem as prisItem.Item;
    return toAnsi(msg.customName ?? msg.displayName ?? msg.name);
  }

  const bot = botOrItem as mineflayer.Bot;
  return toAnsi(item.customName ?? item.displayName ?? item.name, bot.version);
}

export {
  getAnsi,
  getItemNameWithAnsiColor,
}