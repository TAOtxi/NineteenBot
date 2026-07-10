import mineflayer from 'mineflayer';

type Runable = (bot: mineflayer.Bot) => void
type RunableTask = () => Promise<void> | void

class Task {
  public task: RunableTask;
  public minDelay: number;

  constructor(task: RunableTask, delay: number = -1) {
    this.task = task;
    this.minDelay = delay;
  }

  run() {
    return this.task();
  }
}

export default class TaskQueue {
  private id: string;
  private taskList: Task[];
  private bot: mineflayer.Bot;

  constructor(bot: mineflayer.Bot, id: string) {
    this.id = id;
    this.taskList = [];
    this.bot = bot;
  }

  static createTaskQueue(bot: mineflayer.Bot, id: string) {
    return new TaskQueue(bot, id);
  }

  addTask(task: RunableTask, minDelay: number = 0) {
    if (this.taskList.at(-1) !== undefined && this.taskList.at(-1)!.minDelay < 0) {
      throw new Error('Task delay must be greater than 0');
    }
    this.taskList.push(new Task(task, minDelay))
    return this;
  }

  async buid() {
    if (this.taskList.length === 0) {
      throw new Error(`TaskQueue ${this.id} is empty`);
    }
    
    for (let i = 0; i < this.taskList.length; i++) {
      const lastRunTick = this.bot.ticker;
      const task = this.taskList[i];
      if (!task) {
        throw new Error(`TaskQueue ${this.id} task ${i} is undefined`);
      }
      await task.run();
      
      const delta = task.minDelay - (this.bot.ticker - lastRunTick);
      if (delta > 0) {
        await this.bot.createOnceTimeTask(
          `waiting_${this.id}_${i}`, 
          () => {}, delta
        );
      }
    }
  }
}