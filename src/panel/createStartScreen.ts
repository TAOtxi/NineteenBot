import { onPanelChange } from '@/panel/createPanel.js';
import {
  getView,
  openStartScreen,
  type StartResultData,
} from '@/panel/store.js';
import { createBotWithInitialize, createBotWithTask, getBotMap } from '@/module/botManager.js';

function onCancel() {
  if (Object.keys(getBotMap()).length === 0) {
    process.exit(0);
  }
  // 有 bot 在运行则切回主面板
  onPanelChange(true);
}

function onSubmit(result: StartResultData) {
  onPanelChange(true);

  if (result.isApplyTask) {
    createBotWithTask(result.botList, result.server, result.taskName);
  } else {
    createBotWithInitialize(result.bot, result.server);
  }
}

function createStartScreen() {
  openStartScreen({ onSubmit, onCancel });
}

export function hasStartScreen() {
  return getView() === 'start';
}

export default createStartScreen;
