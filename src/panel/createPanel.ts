import blessed from 'blessed';
import fuzzy from 'fuzzy';
import mineflayer from 'mineflayer';
import { CommandManager, CommandType } from '@/plugins/command.js';
import CmdParser from '@/utils/CmdParser.js';
import screen from '@/panel/createScreen.js';
import { fileURLToPath } from 'node:url';
import { hasStartScreen } from '@/panel/createStartScreen.js';

let showTimer: NodeJS.Timeout | null = null;
let currentScrollBox = 0;   // 0: chatBox, 1: logBox
const MAX_HISTORY_DATA = 1000;
const historyCommand = [''];
let historyIdx = 0;

const chatBox = blessed.log({
  parent: screen,
  label: ' 聊天信息 ',
  top: 0,
  left: 0,
  width: '50%',
  height: '85%',
  border: { type: 'line' },
  style: {
    border: { fg: 'cyan' },
    label: { fg: 'cyan', bold: true },
  },
  tags: true,
  scrollable: true,
  alwaysScroll: true,
  scrollbar: { ch: ' ', style: { bg: 'cyan' } },
  mouse: true,
  scrollback: MAX_HISTORY_DATA,
});

// 右上角:日志输出框
const logBox = blessed.log({
  parent: screen,
  label: ' 日志输出 ',
  top: 0,
  left: '50%',
  width: '50%',
  height: '85%',
  border: { type: 'line' },
  style: {
    border: { fg: 'yellow' },
    label: { fg: 'yellow', bold: true },
  },
  tags: true,
  scrollable: true,
  alwaysScroll: true,
  scrollbar: { ch: ' ', style: { bg: 'yellow' } },
  mouse: true,
  scrollback: MAX_HISTORY_DATA,
});

const inputBox = blessed.box({
  parent: screen,
  label: ' 命令输入 (↑↓/Tab 选择, Enter 确认, Esc 退出, alt+↑↓ 选择历史命令) ',
  bottom: 0,
  left: 0,
  width: '90%',
  height: '15%',
  border: { type: 'line' },
  style: {
    border: { fg: 'green' },
    label: { fg: 'green', bold: true },
  },
  tags: true,
});

const suggestList = blessed.list({
  parent: screen,
  label: ' 候选列表 ',
  height: '40%',
  bottom: 0,
  right: 0,
  width: '10%',
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

screen.on('keypress', handleKeyPress);

function setInput(text: string) {
  data.inputValue = text;
  text = text.replace(/\{/g, '{open}').replace(/\}/g, '{close}') + ' ';
  text = `${text.slice(0, data.cursor)}{inverse}${text[data.cursor]}{/inverse}${text.slice(data.cursor + 1)}`;
  inputBox.setContent(`{green-fg}> {/green-fg}${text}`);
}

const data = {
  inputValue: '',
  cursor: 0,
}

function refreshSuggestList() {
  if (!currentBot) return;
  const matches = getInput(data.inputValue, currentBot);

  suggestList.setItems(matches);
  if (matches.length > 0) {
    suggestList.select(0);
  }
}

function runCommand() {
  const command = data.inputValue;
  if (command === '') return;

  outputToLog(`--> Run command: ${command}`);
  if (command.startsWith('/')) {
    currentBot?.chat(command);
  } else {
    currentBot?.tryExecute(command);
  }

  for (let i=historyCommand.length-1; i>=0; i--) {
    if (historyCommand[i] === command) {
      historyCommand.splice(i, 1);
    }
  }
  if (historyCommand.at(-1) === '') {
    historyCommand[historyCommand.length - 1] = command;
  } else {
    historyCommand.push(command);
  }
  historyCommand.push('');
  historyIdx = historyCommand.length - 1;

  data.cursor = 0;
  setInput('');
  refreshSuggestList();
}

const arrowKeys = ['up', 'down', 'left', 'right'];
const functionKeys = ['return', 'enter', 'backspace', 'tab', 'escape', 'delete', ...arrowKeys];

function isTextInput(key: string | undefined) {
  return !key || !functionKeys.includes(key);
}

function insertText(char: string) {
  if (!char) return data.inputValue;

  const cursor = data.cursor;
  const originLength = data.inputValue.length;

  if (cursor === originLength) {
    const newValue = data.inputValue + char;
    data.cursor = newValue.length;
    return newValue;
  }

  if (cursor < 0 || cursor > originLength) {
    data.cursor = originLength + char.length;
    outputToLog(`cursor ${cursor} out of range [0, ${originLength}]`);
    return data.inputValue + char;
  }

  data.cursor += char.length;
  return data.inputValue.slice(0, cursor) + char + data.inputValue.slice(cursor);
}

function handleKeyPress(ch: string, key: any) {
  if (hasStartScreen()) return;
  showSuggestList();

  // logBox?.log(`--> Key pressed: ${ch} - ${JSON.stringify(key)}`);

  const name = key && key.name;

  if (isTextInput(name)) {
    setInput(insertText(ch));
    refreshSuggestList();
    screen.render();
    return;
  }

  if (name === 'enter') {
    runCommand();
  }

  else if (name === 'backspace') {
    if (data.cursor === 0) return;

    const cursor = data.cursor;
    data.cursor--;
    setInput(`${data.inputValue.slice(0, cursor - 1)}${data.inputValue.slice(cursor)}`);
    refreshSuggestList();
  }

  else if (name === 'delete') {
    const endWithSpace = data.inputValue.endsWith(' ');
    let newInput;
    if (endWithSpace) {
      newInput = data.inputValue.trim();
    } else {
      const spaceIdx = data.inputValue.lastIndexOf(' ');
      newInput = spaceIdx === -1 ? '' : data.inputValue.slice(0, spaceIdx + 1);
    }
    data.cursor = newInput.length;
    setInput(newInput);
    refreshSuggestList();
  }

  else if (name === 'tab') {
    // @ts-ignore
    const select = suggestList.ritems[suggestList.selected || 0] || '';
    handleTab(select);
  }

  else if (arrowKeys.includes(name)) {
    handleArrowKey(key);
  }

  else if (name === 'escape') {
    process.exit(0);
  }

  screen.render();
}

function handleArrowKey(key: any) {
  const keyName = key.name;
  const pressShift = key.shift;
  const pressCtrl = key.ctrl;
  const pressAlt = key.meta;
  if (keyName === 'up' || keyName === 'down') {
    if (!pressShift && !pressCtrl && !pressAlt) {
      // @ts-ignore
      const length = suggestList.items.length;
      if (length === 0) return;
      // @ts-ignore
      const idx = suggestList.selected || 0;
      let toSelect = idx;

      if (keyName === 'up') toSelect--;
      else toSelect++;

      if (toSelect < 0) toSelect = length - 1;
      else if (toSelect >= length) toSelect = 0;

      suggestList?.select(toSelect);
    } else if (!pressAlt) {
      const scrollOffset = pressCtrl ? 10 : 5;
      const scrollBox = currentScrollBox === 0 ? chatBox : logBox;
      scrollBox?.scroll(keyName === 'up' ? -scrollOffset : scrollOffset); 
    } else {
      const newHistoryIdx = keyName === 'up' ? historyIdx - 1 : historyIdx + 1;
      if (newHistoryIdx < 0 || newHistoryIdx > historyCommand.length - 1) return;
      
      if (historyIdx === historyCommand.length - 1) {
        historyCommand[historyCommand.length - 1] = data.inputValue;
      }
      historyIdx = newHistoryIdx;

      data.cursor = historyCommand[newHistoryIdx]!.length;
      setInput(historyCommand[newHistoryIdx]!);
      refreshSuggestList();
    }
  } else if (!pressShift) { // left, right
    const length = data.inputValue.length;
    let cursor = data.cursor;

    if (keyName === 'left') cursor--;
    else cursor++;

    if (cursor >= 0 && cursor <= length) {
      data.cursor = cursor;
    }
    setInput(data.inputValue);
  } else {
    currentScrollBox = keyName === 'left' ? 0 : 1;
    if (currentScrollBox === 0) {
      outputToLog('--> Focus on chatBox');
    } else {
      outputToLog('--> Focus on logBox');
    }
  }
}

function handleTab(completion: string) {
  const endWithSpace = data.inputValue.endsWith(' ');
  let newInput = data.inputValue.trim();
  if (endWithSpace) {
    newInput = `${newInput} ${completion}`;
  } else {
    const lastSpace = newInput.lastIndexOf(' ');
    if (lastSpace === -1) {
      newInput = completion;
    } else {
      newInput = `${newInput.slice(0, lastSpace + 1)}${completion}`;
    }
  }
  data.cursor = newInput.length;
  setInput(newInput);
  refreshSuggestList();
}

function getMatch(cmd: string | undefined, tips: CommandManager[]) {
  const cmdList = tips.map(item => item.name).flat();
  const filteredTips = fuzzy.filter(cmd || '', cmdList);
  return filteredTips.map(item => item.string).sort();
}

function getMatchFromArray(cmd: string | undefined, tips: string[]) {
  const filteredTips = fuzzy.filter(cmd || '', tips);
  return filteredTips.map(item => item.string).sort();
}

function getInput(input: string, bot: mineflayer.Bot) {
  if (input.trim() === '') {
    return getMatch('', bot._cmdMap);
  }

  const parseCmd = new CmdParser(input);
  const partLen = parseCmd.getCmds().length + (input.at(-1) === ' ' || parseCmd.hasAnyArg() ? 1 : 0);

  let currentCmdMap = bot._cmdMap;

  for (let i = 0; i < partLen; i++) {
    if (!currentCmdMap || currentCmdMap.length === 0) {
      return [];
    }

    let cmdPart = '';
    if (i === partLen - 1 && parseCmd.hasAnyArg()) {
      cmdPart = parseCmd.getPart(-1) || '';
    } else {
      cmdPart = parseCmd.getFirstCmd() || '';
    }

    let hasCommand = false;
    for (const sub of currentCmdMap) {
      if (sub.level === partLen) {
        if (sub.type === CommandType.VALUE) {
          if (typeof sub.suggest === 'function') {
            return getMatchFromArray(cmdPart, sub.suggest());
          } else if (sub.suggest.length > 0) {
            return getMatchFromArray(cmdPart, sub.suggest);
          }
          return [sub.name] as string[];
        };
        return getMatch(cmdPart, currentCmdMap);
      }

      if (parseCmd.isCmd(sub.name) && sub.subCmds) {
        hasCommand = true;
        currentCmdMap = sub.subCmds;
        parseCmd.dive();
        break;
      }
    }
    if (!hasCommand) {
      break;
    }
  }

  return [];
}

function showSuggestList() {
  showTimer && clearTimeout(showTimer);
  suggestList.show();
  showTimer = setTimeout(() => {
    showTimer = null;
    suggestList.hide();
    screen.render();
  }, 3000);
}

let currentBot: mineflayer.Bot | null = null;


function onBotChange(bot: mineflayer.Bot) {
  currentBot = bot;
  data.cursor = 0;
  setInput('');
  suggestList.setItems(getInput('', bot));
  refreshSuggestList();
  screen.render();
}

function timestamp() {
  return new Date().toTimeString().slice(0, 8);
}

function outputToChat(message: string | number | null | undefined) {
  chatBox.log(message?.toString() || '');
  screen.render();
}

function outputToLog(message: string | number | null | undefined, withTimestamp: boolean = true) {
  let msg = message?.toString() || '';
  if (withTimestamp) {
    msg = `[${timestamp()}] ${msg}`;
  }

  logBox.log(msg);
  screen.render();
}

function onPanelChange(isShow: boolean) {
  if (isShow) {
    chatBox.show();
    logBox.show();
    inputBox.show();
    suggestList.show();
  } else {
    chatBox.hide();
    logBox.hide();
    inputBox.hide();
    suggestList.hide();
  }
  screen.render();
}

console._log = console.log;
console._info = console.info;
console._error = console.error;
console._warn = console.warn;
console.chat = outputToChat;
console.log = outputToLog;
console.info = (msg) => console.log(`[INFO] ${msg}`);
console.warn = (msg) => console.log(`[WARN] ${msg}`);
console.error = (msg) => console.log(`[ERROR] ${msg}`);

declare global {
  interface Console {
    chat: (message: string) => void;
    _log: (...data: any[]) => void;
    _info: (...data: any[]) => void;
    _error: (...data: any[]) => void;
    log: (msg: string | number | null | undefined, withTimestamp?: boolean) => void;
    info: (msg: string | number | null | undefined) => void;
    error: (msg: string | number | null | undefined) => void;
    warn: (msg: string | number | null | undefined) => void;
    _warn: (...data: any[]) => void;
  }
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  onPanelChange(true);
}

export {
  onBotChange,
  onPanelChange,
}