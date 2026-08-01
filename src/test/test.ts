import mineflayer from "mineflayer";



export default function test(bot: mineflayer.Bot) {
  // bot._client.on('set_slot', (packet) => {
  //   console.log(`id: ${packet.windowId} slot: ${packet.slot}`);
  // })
}

declare module 'mineflayer' {
  interface BotEvents {
    'chat:onTest': (match: string[][]) => void,
  }
}
