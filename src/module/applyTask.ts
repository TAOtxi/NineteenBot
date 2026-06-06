import mineflayer from 'mineflayer'

function getTaskMap(): Record<string, Runable> {
  return {
    fish: fishTask,
  }
}


function fishTask(bot: mineflayer.Bot) {
  bot.once('spawn', () => {
    bot.chat('/stp survival2');

    bot.createOnceTimeTask("doFish", 20 * 10, () => {
      bot.startFishing();
    });
  })
}

type Runable = (bot: mineflayer.Bot) => void
type RunableTask = () => void

class Task {
  public task: RunableTask;
  public delay: number;

  constructor(task: RunableTask, delay: number = -1) {
    this.task = task;
    this.delay = delay;
  }

  run() {
    this.task();
  }
}

class TaskQueue {
  private id: string;
  private task: Task[];
  private bot: mineflayer.Bot;

  constructor(bot: mineflayer.Bot, id: string) {
    this.id = id;
    this.task = [];
    this.bot = bot;
  }

  static createTaskQueue(bot: mineflayer.Bot, id: string) {
    return new TaskQueue(bot, id);
  }

  addTask(task: RunableTask, delay: number = -1) {
    if (this.task.at(-1) !== undefined && this.task.at(-1)!.delay < 0) {
      throw new Error('Task delay must be greater than 0');
    }
    this.task.push(new Task(task, delay))
    return this;
  }

  buid() {
    if (this.task.length === 0) {
      throw new Error(`TaskQueue ${this.id} is empty`);
    }
    const firstTask = this.task[0]!;
    if (firstTask.delay < 0) {
      throw new Error('Task delay must be greater than 0');
    }
    this.bot.createTimeTask(this.id, firstTask.delay, () => {
      firstTask.run();
      const nextTask = this.task.shift();
      if (nextTask === undefined) {
        this.bot.removeTimeTask(this.id);
        return;
      }

      this.bot.updateTimeTask(this.id, nextTask.delay, nextTask.run);
      this.bot.restartTimeTask(this.id);
    })
  }
}

export {
  getTaskMap,

}