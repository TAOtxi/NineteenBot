import React, { useRef, useState } from 'react';
import { Box, Text, useInput, useStdin, useWindowSize } from 'ink';
import { getInput } from '@/panel/suggest.js';
import { getBotMap } from '@/module/botManager.js';
import {
  appendLog,
  getChatLines,
  getCurrentBot,
  getLogLines,
  getScrollTarget,
  setScrollTarget,
  useStoreValue,
} from '@/panel/hooks.js';

// 输入区（含候选列表）之外，主内容区两个框的边框行数
const BORDER_ROWS = 2;
// 输入框固定高度（含边框）
const INPUT_ROWS = 3;
// 候选列表最多展示的行数
const MAX_SUGGEST_ROWS = 8;

interface ScrollBoxProps {
  title: string;
  color: string;
  lines: string[];
  offset: number;
  visibleRows: number;
  width: string;
  focused: boolean;
}

// 可滚动文本框：根据 offset 从底部向上切片显示
function ScrollBox({ title, color, lines, offset, visibleRows, width, focused }: ScrollBoxProps) {
  const end = Math.max(0, lines.length - offset);
  const start = Math.max(0, end - visibleRows);
  const shown = lines.slice(start, end);
  const label = focused ? `${title} ●` : title;

  return (
    <Box
      flexDirection="column"
      width={width}
      borderStyle="round"
      borderColor={color}
    >
      <Text color={color} bold>{` ${label} `}</Text>
      {shown.map((line, idx) => (
        <Text key={start + idx} wrap="truncate-end">{line}</Text>
      ))}
    </Box>
  );
}

const MAX_HISTORY = 1000;
const arrowKeys = ['up', 'down', 'left', 'right'];

export default function MainPanel() {
  useStoreValue(); // 订阅 store 变更
  const { columns, rows } = useWindowSize();
  const { isRawModeSupported } = useStdin();

  const [inputValue, setInputValue] = useState('');
  const [cursor, setCursor] = useState(0);
  const [suggests, setSuggests] = useState<string[]>([]);
  const [suggestIdx, setSuggestIdx] = useState(0);
  const [showSuggest, setShowSuggest] = useState(false);
  // 两个框各自的滚动偏移（距底部行数）
  const [chatOffset, setChatOffset] = useState(0);
  const [logOffset, setLogOffset] = useState(0);

  const historyRef = useRef<string[]>(['']);
  const historyIdxRef = useRef(0);
  const suggestTimer = useRef<NodeJS.Timeout | null>(null);

  const scrollTarget = getScrollTarget();
  const chatLines = getChatLines();
  const logLines = getLogLines();

  // 主内容区高度 = 总高度 - 输入框 - 候选列表
  const suggestRows = showSuggest && suggests.length > 0
    ? Math.min(suggests.length, MAX_SUGGEST_ROWS) + BORDER_ROWS
    : 0;
  const bodyRows = Math.max(3, rows - INPUT_ROWS - suggestRows);
  const visibleRows = Math.max(1, bodyRows - BORDER_ROWS - 1); // -1 为 label 行

  function refreshSuggest(value: string) {
    const bot = getCurrentBot();
    if (!bot) {
      setSuggests([]);
      return;
    }
    const matches = getInput(value, bot);
    setSuggests(matches);
    setSuggestIdx(matches.length > 0 ? 0 : -1);
  }

  function popSuggest() {
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      setShowSuggest(false);
      suggestTimer.current = null;
    }, 3000);
  }

  function runCommand() {
    const command = inputValue;
    if (command === '') return;
    const bot = getCurrentBot();

    appendLog('');
    appendLog(`--> Run command: ${command}`);
    if (command.startsWith('/')) {
      bot?.chat(command);
    } else {
      bot?.tryExecute(command);
    }

    const history = historyRef.current;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i] === command) history.splice(i, 1);
    }
    if (history.at(-1) === '') {
      history[history.length - 1] = command;
    } else {
      history.push(command);
    }
    history.push('');
    if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY);
    historyIdxRef.current = history.length - 1;

    setCursor(0);
    setInputValue('');
    refreshSuggest('');
  }

  function handleTab() {
    const completion = suggests[suggestIdx] ?? '';
    if (!completion) return;
    const endWithSpace = inputValue.endsWith(' ');
    let newInput = inputValue.trim();
    if (endWithSpace) {
      newInput = `${newInput} ${completion}`;
    } else {
      const lastSpace = newInput.lastIndexOf(' ');
      newInput = lastSpace === -1 ? completion : `${newInput.slice(0, lastSpace + 1)}${completion}`;
    }
    setInputValue(newInput);
    setCursor(newInput.length);
    refreshSuggest(newInput);
  }

  function scroll(target: 0 | 1, delta: number) {
    if (target === 0) {
      setChatOffset(o => clampOffset(o + delta, chatLines.length, visibleRows));
    } else {
      setLogOffset(o => clampOffset(o + delta, logLines.length, visibleRows));
    }
  }

  useInput((input, key) => {
    popSuggest();

    // 文本输入（含粘贴）。剥离控制字符，避免回车/换行/转义序列混入输入框
    if (!key.upArrow && !key.downArrow && !key.leftArrow && !key.rightArrow &&
        !key.return && !key.tab && !key.backspace && !key.delete && !key.escape && input) {
      // eslint-disable-next-line no-control-regex
      const text = input.replace(/[\x00-\x1f\x7f]/g, '');
      if (!text) return;
      const next = inputValue.slice(0, cursor) + text + inputValue.slice(cursor);
      setInputValue(next);
      setCursor(cursor + text.length);
      refreshSuggest(next);
      return;
    }

    if (key.return) {
      runCommand();
      return;
    }

    if (key.backspace || key.delete) {
      // Ink 中 backspace/delete 语义因终端而异，这里统一按"删除光标前一个字符"处理
      if (cursor === 0) return;
      const next = inputValue.slice(0, cursor - 1) + inputValue.slice(cursor);
      setInputValue(next);
      setCursor(cursor - 1);
      refreshSuggest(next);
      return;
    }

    if (key.tab) {
      handleTab();
      return;
    }

    if (key.escape) {
      for (const bot of Object.values(getBotMap())) {
        bot.emit('cleanup');
        bot.quit();
      }
      process.exit(0);
    }

    if (key.upArrow || key.downArrow) {
      const dir = key.upArrow ? -1 : 1;
      if (key.shift || key.ctrl) {
        // 滚动窗口
        const step = (key.ctrl ? 10 : 5) * (key.upArrow ? 1 : -1);
        scroll(scrollTarget, step);
      } else if (key.meta) {
        // 历史命令
        const history = historyRef.current;
        const newIdx = historyIdxRef.current + dir;
        if (newIdx < 0 || newIdx > history.length - 1) return;
        if (historyIdxRef.current === history.length - 1) {
          history[history.length - 1] = inputValue;
        }
        historyIdxRef.current = newIdx;
        const val = history[newIdx] ?? '';
        setInputValue(val);
        setCursor(val.length);
        refreshSuggest(val);
      } else {
        // 候选列表导航
        if (suggests.length === 0) return;
        let idx = suggestIdx + dir;
        if (idx < 0) idx = suggests.length - 1;
        else if (idx >= suggests.length) idx = 0;
        setSuggestIdx(idx);
      }
      return;
    }

    if (key.leftArrow || key.rightArrow) {
      if (key.shift) {
        // 切换聚焦的滚动框
        setScrollTarget(key.leftArrow ? 0 : 1);
        appendLog(key.leftArrow ? '--> Focus on chatBox' : '--> Focus on logBox');
      } else {
        const next = key.leftArrow ? cursor - 1 : cursor + 1;
        if (next >= 0 && next <= inputValue.length) setCursor(next);
      }
    }
  }, { isActive: isRawModeSupported });

  // 渲染带光标的输入内容
  const cursorChar = inputValue[cursor] ?? ' ';
  const before = inputValue.slice(0, cursor);
  const after = inputValue.slice(cursor + 1);

  return (
    <Box flexDirection="column" width={columns} height={rows}>
      <Box flexDirection="row" height={bodyRows}>
        <ScrollBox
          title=" 聊天信息 "
          color="cyan"
          lines={chatLines}
          offset={chatOffset}
          visibleRows={visibleRows}
          width="50%"
          focused={scrollTarget === 0}
        />
        <ScrollBox
          title=" 日志输出 "
          color="yellow"
          lines={logLines}
          offset={logOffset}
          visibleRows={visibleRows}
          width="50%"
          focused={scrollTarget === 1}
        />
      </Box>

      {showSuggest && suggests.length > 0 && (
        <Box flexDirection="column" borderStyle="round" borderColor="green">
          <Text color="green" bold> 候选列表 </Text>
          {suggests.slice(0, MAX_SUGGEST_ROWS).map((item, idx) => (
            <Text key={item + idx} inverse={idx === suggestIdx}>{item}</Text>
          ))}
        </Box>
      )}

      <Box borderStyle="round" borderColor="green" height={INPUT_ROWS}>
        <Text>
          <Text color="green">{'> '}</Text>
          {before}
          <Text inverse>{cursorChar}</Text>
          {after}
        </Text>
      </Box>
    </Box>
  );
}

function clampOffset(offset: number, total: number, visibleRows: number) {
  const max = Math.max(0, total - visibleRows);
  if (offset < 0) return 0;
  if (offset > max) return max;
  return offset;
}
