import blessed from 'blessed';
import { getTaskList } from "@/plugins/initTask.js";
import { onPanelChange } from '@/panel/createPanel.js';
import screen from '@/panel/createScreen.js';
import { getServerNameList, getAccountNameList } from '@/Config/loadConfig.js';
import { createBotWithInitialize, createBotWithTask, getBotMap } from '@/module/botManager.js';

let selectBox: blessed.Widgets.ListElement | null = null;
const SELECT_ICON = '◯';
const startOptions = {
  isApplyTask: false,
  botList: [] as string[],
  taskName: '',
  bot: '',
  server: '',
}

function onCancel() {
  if (!selectBox) {
    throw new Error('SelectBox is not created');
  }
  
  selectBox.destroy();
  selectBox = null;

  if (Object.keys(getBotMap()).length === 0) {
    process.exit(0);
  }

  onPanelChange(true);
  
}

function createStartScreen() {
  onPanelChange(false);
  selectBox?.destroy();

  selectBox = blessed.list({
    parent: screen,
    width: '100%',
    height: '60%',
    border: { type: 'line' },
    style: {
      border: { fg: 'green' },
      selected: { bg: 'green', fg: 'black' },
      item: { fg: 'white' },
    },
    tags: true,
    mouse: true,
    scrollable: true,
  });

  selectBox.key('escape', onCancel);

  selectBox.focus();
  
  selectBox.key('up', () => handleArrowKey(true));
  selectBox.key('down', () => handleArrowKey(false));

  applyTaskOrCreateBot();
}

function handleArrowKey(flag: boolean) {
  if (!selectBox) {
    throw new Error('SelectBox is not created');
  }
  // @ts-ignore
  let selectIdx = selectBox.selected;
  if (flag) selectIdx--;
  else selectIdx++;

  // @ts-ignore
  const len = selectBox.items.length;
  if (selectIdx < 0) selectIdx = len - 1;
  else if (selectIdx >= len) selectIdx = 0;

  selectBox.select(selectIdx);
  screen.render();
}

function applyTaskOrCreateBot() {
  if (!selectBox) {
    throw new Error('SelectBox is not created');
  }

  selectBox.setLabel('选择 Bot 启动方式：（按下ESC退出选择）');
  selectBox.setItems(['1. 批量应用', '2. 单独创建']);

  screen.render();

  const handleEnterKey = () => {
    // @ts-ignore
    const isApplyTask = selectBox.selected === 0;

    startOptions.isApplyTask = isApplyTask;
    if (isApplyTask) {
      onSelectMultiBot();
    } else {
      onSelectSingleBot();
    }
    selectBox?.removeKey('enter', handleEnterKey);
  }

  selectBox.key('enter', handleEnterKey);
}

function onSelectMultiBot() {
  if (!selectBox) {
    throw new Error('SelectBox is not created');
  }

  selectBox.setLabel('选择若干 Bot：（按下ESC退出选择）');
  selectBox.setItems(getAccountNameList());
  selectBox.select(0);
  screen.render();

  selectBox.removeKey('space', handleSpaceKey);
  selectBox.key('space', handleSpaceKey);

  const onSubmit = () => {
    if (!selectBox) {
      throw new Error('SelectBox is not created');
    }

    // @ts-ignore
    const items = selectBox.ritems as string[];
    startOptions.botList = items.filter(item => item.endsWith(SELECT_ICON)).map(item => item.replace(SELECT_ICON, '').trim());
    if (startOptions.botList.length === 0) {
      return;
    }

    selectBox.removeKey('enter', onSubmit);
    onSelectTask();
  }

  selectBox.key('enter', onSubmit);
}

function onSelectTask() {
  if (!selectBox) {
    throw new Error('SelectBox is not created');
  }

  selectBox.setLabel('选择要应用的任务：（按下ESC退出选择）');
  selectBox.setItems(getTaskList());
  selectBox.select(0);
  screen.render();

  const onSubmit = () => {
    if (!selectBox) {
      throw new Error('SelectBox is not created');
    }
    const selectItem = getListBoxSelectItem();

    startOptions.taskName = selectItem;
    selectBox.removeKey('enter', onSubmit);
    onSelectServer();
  }

  selectBox.key('enter', onSubmit);
}

function handleSpaceKey() {
  if (!selectBox) {
    throw new Error('SelectBox is not created');
  }

  // @ts-ignore
  const selectIdx = selectBox.selected;
  // @ts-ignore
  const botList = selectBox.ritems as string[];
  if (!botList[selectIdx]) return;

  if (botList[selectIdx].endsWith(SELECT_ICON)) {
    botList[selectIdx] = botList[selectIdx].replace(SELECT_ICON, '').trim();
  } else {
    botList[selectIdx] = botList[selectIdx].padEnd(10, ' ') + SELECT_ICON;
  }
  
  selectBox.setItems(botList);
  screen.render();
}

function onSelectSingleBot() {
  if (!selectBox) {
    throw new Error('SelectBox is not created');
  }

  selectBox.setLabel('选择要登录的Bot：（按下ESC退出选择）');
  selectBox.setItems(getAccountNameList());
  selectBox.select(0);

  const onSubmit = () => {
    if (!selectBox) {
      throw new Error('SelectBox is not created');
    }
    startOptions.bot = getListBoxSelectItem();
    onSelectServer();

    selectBox.removeKey('enter', onSubmit);
  }

  selectBox.key('enter', onSubmit);
  screen.render();
}

function getListBoxSelectItem() {
  if (!selectBox) {
    throw new Error('SelectBox is not created');
  }

  // @ts-ignore
  const selectIdx = selectBox.selected;
  // @ts-ignore
  return selectBox.ritems[selectIdx];
}

function onSelectServer() {
  if (!selectBox) {
    throw new Error('SelectBox is not created');
  }

  selectBox.setLabel('选择要创建的服务器：（按下ESC退出选择）');
  selectBox.setItems(getServerNameList());
  selectBox.select(0);
  screen.render();

  const onSubmit = () => {
    startOptions.server = getListBoxSelectItem();
    selectBox?.destroy();
    selectBox = null;
    
    onPanelChange(true);

    if (startOptions.isApplyTask) {
      createBotWithTask(startOptions.botList, startOptions.server, startOptions.taskName);
    } else {
      createBotWithInitialize(startOptions.bot, startOptions.server);
    }
  }

  selectBox.key('enter', onSubmit);
}

export function hasStartScreen() {
  return selectBox !== null;
}

export default createStartScreen;