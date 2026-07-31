import React from 'react';
import { Box } from 'ink';
import MainPanel from '@/panel/MainPanel.js';
import StartScreen from '@/panel/StartScreen.js';
import { getView, getStartHandlers, useStoreValue } from '@/panel/hooks.js';

export default function App() {
  useStoreValue(); // 订阅 store 变更
  const view = getView();

  if (view === 'start') {
    const handlers = getStartHandlers();
    if (handlers) {
      return (
        <StartScreen
          onSubmit={handlers.onSubmit}
          onCancel={handlers.onCancel}
        />
      );
    }
  }

  if (view === 'main') {
    return <MainPanel />;
  }

  // hidden：渲染空盒子占位，Ink 需要一个根节点
  return <Box />;
}
