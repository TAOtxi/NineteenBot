import { applyTaskOrCreateBot } from './module/botManager.js';
import { select, checkbox } from '@inquirer/prompts';
import fs from 'fs';
import { type UserConfig } from './module/botManager.js';
import { getTaskMap } from './module/applyTask.js';

applyTaskOrCreateBot();