import type mineflayer from 'mineflayer';

// 面板视图类型
export type PanelView = 'hidden' | 'main' | 'start';

const MAX_HISTORY_DATA = 1000;

// 聚焦的滚动窗口：0 -> 聊天框, 1 -> 日志框
export type ScrollTarget = 0 | 1;

export interface StartHandlers {
  onSubmit: (result: StartResultData) => void;
  onCancel: () => void;
}

export interface StartResultData {
  isApplyTask: boolean;
  botList: string[];
  taskName: string;
  bot: string;
  server: string;
}

interface PanelState {
  view: PanelView;
  chatLines: string[];
  logLines: string[];
  currentBot: mineflayer.Bot | null;
  scrollTarget: ScrollTarget;
  // 启动向导的提交/取消回调，由适配层注入以避免循环依赖
  startHandlers: StartHandlers | null;
  // 每次数据/状态变更都自增，供 useSyncExternalStore 生成新快照
  revision: number;
}

const state: PanelState = {
  view: 'hidden',
  chatLines: [],
  logLines: [],
  currentBot: null,
  scrollTarget: 0,
  startHandlers: null,
  revision: 0,
};

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  state.revision++;
  for (const listener of listeners) {
    listener();
  }
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot() {
  return state.revision;
}

// ---- 读取器 ----
export function getView() {
  return state.view;
}

export function getChatLines() {
  return state.chatLines;
}

export function getLogLines() {
  return state.logLines;
}

export function getScrollTarget() {
  return state.scrollTarget;
}

export function getCurrentBot() {
  return state.currentBot;
}

export function getStartHandlers() {
  return state.startHandlers;
}

// ---- 变更器 ----
function pushLine(target: string[], message: string) {
  // 支持多行文本一次写入
  const parts = message.split('\n');
  target.push(...parts);
  if (target.length > MAX_HISTORY_DATA) {
    target.splice(0, target.length - MAX_HISTORY_DATA);
  }
}

export function appendChat(message: string | number | null | undefined) {
  pushLine(state.chatLines, message?.toString() ?? '');
  emit();
}

export function appendLog(message: string | number | null | undefined) {
  pushLine(state.logLines, message?.toString() ?? '');
  emit();
}

export function setView(view: PanelView) {
  if (state.view === view) return;
  state.view = view;
  emit();
}

export function setScrollTarget(target: ScrollTarget) {
  if (state.scrollTarget === target) return;
  state.scrollTarget = target;
  emit();
}

export function setCurrentBot(bot: mineflayer.Bot | null) {
  state.currentBot = bot;
  emit();
}

// 显示启动向导，并注入完成/取消回调
export function openStartScreen(handlers: StartHandlers) {
  state.startHandlers = handlers;
  state.view = 'start';
  emit();
}
