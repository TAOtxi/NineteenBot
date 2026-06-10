import mineflayer from 'mineflayer'



export default function inject(bot: mineflayer.Bot) {
  bot.taskQueue = [];
}


declare module 'mineflayer' {
  interface Bot {
    taskQueue: TaskQueue[];
  }
}

type Runable = () => (void | Promise<void>)

interface TaskQueue {
  id: string;
  task: Runable[];
}
