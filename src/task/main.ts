import { registerTask } from '../plugins/initTask.js';
import { fishTask, fishTask1 } from './fish.js';
import water from '../task/waterTree.js';
import signIn from './signIn.js';
import autoGet24Reward from './autoGet24Reward.js';
import { killTask, afkTask, WITHER_SKULL_AFK_TASK, WITHER_SKULL_KILL_TASK } from './witherSkull.js';

export default function initialize() {
  registerTask('fish', fishTask);
  registerTask('fish1', fishTask1);
  registerTask('signIn', signIn);
  registerTask('water', water);
  registerTask('autoGet24Reward', autoGet24Reward);
  registerTask(WITHER_SKULL_AFK_TASK, afkTask);
  registerTask(WITHER_SKULL_KILL_TASK, killTask);
  registerTask('empty', () => {});
}