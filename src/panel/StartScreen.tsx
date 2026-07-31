import React, { useState } from 'react';
import { Box, Text, useInput, useStdin } from 'ink';
import { getTaskList } from '@/plugins/initTask.js';
import { getServerNameList, getAccountNameList } from '@/Config/loadConfig.js';

const SELECT_ICON = '◯';

// 向导步骤
type Step = 'mode' | 'multiBot' | 'task' | 'singleBot' | 'server';

export interface StartResult {
  isApplyTask: boolean;
  botList: string[];
  taskName: string;
  bot: string;
  server: string;
}

interface Props {
  // 完成选择后创建 bot
  onSubmit: (result: StartResult) => void;
  // 按 ESC 取消
  onCancel: () => void;
}

interface StepConfig {
  label: string;
  items: string[];
  multiple: boolean;
}

export default function StartScreen({ onSubmit, onCancel }: Props) {
  const { isRawModeSupported } = useStdin();
  const [step, setStep] = useState<Step>('mode');
  const [selected, setSelected] = useState(0);
  // 多选 bot 时被勾选的下标集合
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [result, setResult] = useState<StartResult>({
    isApplyTask: false,
    botList: [],
    taskName: '',
    bot: '',
    server: '',
  });

  const config = getStepConfig(step);

  function goto(next: Step) {
    setStep(next);
    setSelected(0);
    setChecked(new Set());
  }

  function confirm() {
    const items = config.items;
    if (items.length === 0) return;

    switch (step) {
      case 'mode': {
        const isApplyTask = selected === 0;
        setResult(r => ({ ...r, isApplyTask }));
        goto(isApplyTask ? 'multiBot' : 'singleBot');
        break;
      }
      case 'multiBot': {
        const botList = [...checked].map(idx => items[idx]!).filter(Boolean);
        if (botList.length === 0) return;
        setResult(r => ({ ...r, botList }));
        goto('task');
        break;
      }
      case 'task': {
        setResult(r => ({ ...r, taskName: items[selected]! }));
        goto('server');
        break;
      }
      case 'singleBot': {
        setResult(r => ({ ...r, bot: items[selected]! }));
        goto('server');
        break;
      }
      case 'server': {
        const finalResult = { ...result, server: items[selected]! };
        onSubmit(finalResult);
        break;
      }
    }
  }

  useInput((input, key) => {
    const len = config.items.length;

    if (key.escape) {
      onCancel();
      return;
    }

    if (key.upArrow || key.downArrow) {
      if (len === 0) return;
      let idx = selected + (key.upArrow ? -1 : 1);
      if (idx < 0) idx = len - 1;
      else if (idx >= len) idx = 0;
      setSelected(idx);
      return;
    }

    // 空格：多选模式下勾选/取消
    if (input === ' ' && config.multiple) {
      setChecked(prev => {
        const next = new Set(prev);
        if (next.has(selected)) next.delete(selected);
        else next.add(selected);
        return next;
      });
      return;
    }

    if (key.return) {
      confirm();
    }
  }, { isActive: isRawModeSupported });

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="green" width="100%">
      <Text color="green" bold>{` ${config.label}（按下 ESC 退出选择）`}</Text>
      {config.items.map((item, idx) => {
        const isChecked = config.multiple && checked.has(idx);
        const marker = isChecked ? ` ${SELECT_ICON}` : '';
        return (
          <Text key={item + idx} inverse={idx === selected}>
            {`${item}${marker}`}
          </Text>
        );
      })}
    </Box>
  );
}

function getStepConfig(step: Step): StepConfig {
  switch (step) {
    case 'mode':
      return { label: '选择 Bot 启动方式：', items: ['1. 批量应用', '2. 单独创建'], multiple: false };
    case 'multiBot':
      return { label: '选择若干 Bot：（空格勾选）', items: getAccountNameList(), multiple: true };
    case 'task':
      return { label: '选择要应用的任务：', items: getTaskList(), multiple: false };
    case 'singleBot':
      return { label: '选择要登录的 Bot：', items: getAccountNameList(), multiple: false };
    case 'server':
      return { label: '选择要创建的服务器：', items: getServerNameList(), multiple: false };
  }
}
