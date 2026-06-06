import { createBotWithConfig, createBotWithTask } from './module/botManager.js';
import { select, checkbox } from '@inquirer/prompts';
import fs from 'fs';
import { type UserConfig } from './module/botManager.js';
import { getTaskMap } from './module/applyTask.js';

applyTaskOrCreateBot();

async function applyTaskOrCreateBot() {
  const task = await select({
    message: 'Apply task or create bot',
    choices: ['Apply task', 'Create bot'],
  });

  if (task === 'Apply task') {
    createBotAndApplyTask();
  } else if (task === 'Create bot') {
    createBotWithConfig();
  }
}

async function createBotAndApplyTask() {
  const baseConfig = JSON.parse(fs.readFileSync("./config/config.json", 'utf-8')) as UserConfig;
  const botNameList = Object.keys(baseConfig.Users);

  const bots = await checkbox({
    message: 'Select the bots to create',
    choices: botNameList,
  });

  const server = await select({
    message: 'Select the server to create',
    choices: Object.keys(baseConfig.Servers),
  });

  const task = await select({
    message: 'Select the task to apply',
    choices: Object.keys(getTaskMap()),
  });

  for (const bot of bots) {
    createBotWithTask(bot, server, task);
  }
}