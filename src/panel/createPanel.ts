import React from 'react';
import { render } from 'ink';
import type mineflayer from 'mineflayer';
import { fileURLToPath } from 'node:url';
import App from '@/panel/App.js';
import {
  appendChat,
  appendLog,
  setCurrentBot,
  setView,
} from '@/panel/store.js';

const noPanel = process.argv.includes('--noPanel');

function timestamp() {
  return new Date().toTimeString().slice(0, 8);
}

function outputToChat(message: string | number | null | undefined) {
  appendChat(message?.toString() || '');
}

function outputToLog(message: string | number | null | undefined, withTimestamp: boolean = true) {
  let msg = message?.toString() || '';
  if (withTimestamp) {
    msg = `[${timestamp()}] ${msg}`;
  }
  appendLog(msg);
}

// 切换主面板显示/隐藏
function onPanelChange(isShow: boolean) {
  setView(isShow ? 'main' : 'hidden');
}

// 当前展示的 bot 变更
function onBotChange(bot: mineflayer.Bot) {
  setCurrentBot(bot);
}

// Ink 依赖 raw mode 读取按键，只有真实 TTY 才能挂载交互式面板
const canRenderPanel = !noPanel && !!process.stdin.isTTY;

if (canRenderPanel) {
  console._log = console.log;
  console._info = console.info;
  console._error = console.error;
  console._warn = console.warn;
  console.chat = outputToChat;
  console.log = outputToLog;
  console.info = (msg) => console.log(`[INFO] ${msg}`);
  console.warn = (msg) => console.log(`[WARN] ${msg}`);
  console.error = (msg) => console.log(`[ERROR] ${msg}`);

  // 渲染 Ink 应用（单例，全程常驻）
  render(React.createElement(App), { exitOnCtrlC: true });
} else {
  // 非交互式环境（--noPanel 或输出被重定向）：保留原生输出，聊天并入日志
  console.chat = console.log;
}

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
};
