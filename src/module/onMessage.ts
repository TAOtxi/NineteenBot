import mineflayer from 'mineflayer';
import { type ChatMessage } from "prismarine-chat";

function setChatPattern(bot: mineflayer.Bot) {
  bot.addChatPattern(
    'onQQMessage', 
    /^\[!\]\[拾玖世界同好会.*?\(1321075268\)>&quit\s+(\w+)$/, 
    { parse: true, repeat: true }
  );

  bot.on('chat:onQQMessage', (match: string[][]) => {
    const user = match[0]![0]!;
    if (user === bot.username && bot.identifier.includes('拾玖世界')) {
      bot.tryExecute('quit');
    }
  })

  bot.addChatPattern(
    'onTpa', 
    /^(\w+) 请求传送到你这里/, 
    { parse: true, repeat: true }
  );

  bot.on('chat:onTpa', (match: string[][]) => {
    const user = match[0]![0]!;
    if (!bot.admins.includes(user)) {
      bot.whisper(user, '[自动回复] 挂机中，有事 QQ 联系 TAOtxi~');
      return;
    }
    bot.chat('/tpaccept');
  })
}

const ignoreRule: RegExp[] = [
  /^钓鱼 /,
  /^\[拾玖福彩\]/,
  /^【猜单词游戏】|^拾玖喵不太认识这个单词|^提示：|^用 \/word|^当前词库：|^-----------/,
  /^地震|^ 20\d{2}年\d{2}月\d{2}日 \d{2}时\d{2}分\d{2}秒 发生|^ (?:震中|震级|深度|最大震度|海啸信息|最大烈度|更新时间)|^紧急地震|^中国地震/,
  /^拾玖喵小道消息/,
  // /^拾玖喵次元口袋/,
  /^别忘了去看看，奖励多多别错过喵~/,
  /^$/,
  /^输入\/show来向大家炫耀你的物品吧喵~/,
  /^\[.\] (?:拾玖型扫地机器人|深渊已|东西被扫走了|垃圾桶清空了)/,
  // /^\w{1,16} 从 \w+ 切换到 \w+|^\w{1,16} 离开了 \w+/,
  // /^\w{1,16}(?:退出|加入)了游戏|^\w{1,16} joined \w+|^\w{1,16} was disconnected/,
  // /^<\w{1,16}> (?:\d+|all)$/
]

function shouldIgnore(msg: string) {
  for (const rule of ignoreRule) {
    if (rule.test(msg)) {
      return true;
    }
  }
  return false;
}


export default function onMessage(bot: mineflayer.Bot) {
  setChatPattern(bot);
  
  bot.on('whisper', (username: string, message: string) => {
    if (!bot.admins.includes(username)) {
      bot.whisper(username, '[自动回复] 挂机中，有事 QQ 联系 TAOtxi');
      return;
    }

    message = message.trim();
    if (message.startsWith('/')) {
      bot.chat(message);
    } else {
      bot.tryExecute(message);
    }
  });

  bot.on("message", (msg: ChatMessage) => {
    if (shouldIgnore(msg.toString())) {
      return;
    }

    // bot.withoutLogTitle().baseInfo('chat', JSON.stringify(msg, null, 2));
    bot.baseInfo('chat', msg.toAnsi());
  });
}


type MatcherCallback = (match: string[][]) => void;

declare module 'mineflayer' {
  interface BotEvents {
    'chat:onQQMessage': MatcherCallback,
    'chat:onTpa': MatcherCallback,
  }
}
