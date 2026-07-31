import { useSyncExternalStore } from 'react';
import { subscribe, getSnapshot } from '@/panel/store.js';

// 订阅 store 的 revision，任一状态变更都会触发组件重渲染。
// 具体数据仍通过下方 re-export 的 getter 读取（读取的是最新引用）。
export function useStoreValue() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export {
  getView,
  getChatLines,
  getLogLines,
  getScrollTarget,
  getCurrentBot,
  getStartHandlers,
  setView,
  setScrollTarget,
  setCurrentBot,
  openStartScreen,
  appendChat,
  appendLog,
} from '@/panel/store.js';
