import mineflayer from "mineflayer";



export default function test(bot: mineflayer.Bot) {
  
}

declare module 'mineflayer' {
  interface BotEvents {
    'chat:onTest': (match: string[][]) => void,
  }
}
