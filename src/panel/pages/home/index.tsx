import ScrollBox from '@/panel/components/ScrollBox.js';
import { Box, useInput, useApp } from 'ink';
import useStdoutDimensions from '@/panel/hooks/useStdoutDimensions.js';
import { useState, useRef, useEffect } from 'react';
import ContainerBox from '@/panel/components/ContainerBox.js';
import TextInput from 'ink-text-input';

const logs = [
  "[2026-08-05 09:12:03] [INFO]  auth: 用户 alice 登录成功",
  "[2026-08-05 09:12:47] [INFO]  order: 创建订单 #10231，金额 ¥299.00",
  "[2026-08-05 09:13:15] [WARN]  cache: 缓存命中率下降至 62%，建议检查热点 key",
  "[2026-08-05 09:14:02] [ERROR] payment: 支付网关超时，订单 #10231 回滚",
  "[2026-08-05 09:14:05] [INFO]  payment: 订单 #10231 已自动重试",
  "[2026-08-05 09:15:38] [DEBUG] db: SQL 执行耗时 128ms: SELECT * FROM users WHERE id=?",
  "[2026-08-05 09:16:20] [INFO]  auth: 用户 bob 登录成功",
  "[2026-08-05 09:17:11] [WARN]  system: 内存使用率 85%，接近告警阈值",
  "[2026-08-05 09:18:44] [ERROR] api: 接口 /api/v1/report 返回 500，重试 3 次失败",
  "[2026-08-05 09:19:59] [INFO]  job: 定时任务 daily-report 执行完成，处理 1420 条记录,job: 定时任务 daily-report 执行完成，处理 1420 条记录",
  "[2026-08-05 09:21:07] [INFO]  auth: 用户 carol 登录成功",
  "[2026-08-05 09:22:33] [WARN]  network: 与节点 10.0.0.5 心跳延迟 480ms",
  "[2026-08-05 09:23:50] [ERROR] db: 数据库连接池耗尽，等待可用连接",
  "[2026-08-05 09:24:12] [INFO]  db: 连接池已扩容至 20，恢复正常",
  "[2026-08-05 09:25:44] [DEBUG] cache: 刷新 key user:1001，TTL 300s",
  "[2026-08-05 09:12:03] [INFO]  auth: 用户 alice 登录成功",
  "[2026-08-05 09:12:47] [INFO]  order: 创建订单 #10231，金额 ¥299.00",
  "[2026-08-05 09:13:15] [WARN]  cache: 缓存命中率下降至 62%，建议检查热点 key",
  "[2026-08-05 09:14:02] [ERROR] payment: 支付网关超时，订单 #10231 回滚",
  "[2026-08-05 09:14:05] [INFO]  payment: 订单 #10231 已自动重试",
  "[2026-08-05 09:15:38] [DEBUG] db: SQL 执行耗时 128ms: SELECT * FROM users WHERE id=?",
  "[2026-08-05 09:16:20] [INFO]  auth: 用户 bob 登录成功",
  "[2026-08-05 09:17:11] [WARN]  system: 内存使用率 85%，接近告警阈值",
  "[2026-08-05 09:18:44] [ERROR] api: 接口 /api/v1/report 返回 500，重试 3 次失败",
  "[2026-08-05 09:19:59] [INFO]  job: 定时任务 daily-report 执行完成，处理 1420 条记录,job: 定时任务 daily-report 执行完成，处理 1420 条记录",
  "[2026-08-05 09:21:07] [INFO]  auth: 用户 carol 登录成功",
  "[2026-08-05 09:22:33] [WARN]  network: 与节点 10.0.0.5 心跳延迟 480ms",
  "[2026-08-05 09:23:50] [ERROR] db: 数据库连接池耗尽，等待可用连接",
  "[2026-08-05 09:24:12] [INFO]  db: 连接池已扩容至 20，恢复正常",
  "[2026-08-05 09:25:44] [DEBUG] cache: 刷新 key user:1001，TTL 300s",
  "[2026-08-05 09:12:03] [INFO]  auth: 用户 alice 登录成功",
  "[2026-08-05 09:12:47] [INFO]  order: 创建订单 #10231，金额 ¥299.00",
  "[2026-08-05 09:13:15] [WARN]  cache: 缓存命中率下降至 62%，建议检查热点 key",
  "[2026-08-05 09:14:02] [ERROR] payment: 支付网关超时，订单 #10231 回滚",
  "[2026-08-05 09:14:05] [INFO]  payment: 订单 #10231 已自动重试",
  "[2026-08-05 09:15:38] [DEBUG] db: SQL 执行耗时 128ms: SELECT * FROM users WHERE id=?",
  "[2026-08-05 09:16:20] [INFO]  auth: 用户 bob 登录成功",
  "[2026-08-05 09:17:11] [WARN]  system: 内存使用率 85%，接近告警阈值",
  "[2026-08-05 09:18:44] [ERROR] api: 接口 /api/v1/report 返回 500，重试 3 次失败",
  "[2026-08-05 09:19:59] [INFO]  job: 定时任务 daily-report 执行完成，处理 1420 条记录,job: 定时任务 daily-report 执行完成，处理 1420 条记录",
  "[2026-08-05 09:21:07] [INFO]  auth: 用户 carol 登录成功",
  "[2026-08-05 09:22:33] [WARN]  network: 与节点 10.0.0.5 心跳延迟 480ms",
  "[2026-08-05 09:23:50] [ERROR] db: 数据库连接池耗尽，等待可用连接",
  "[2026-08-05 09:24:12] [INFO]  db: 连接池已扩容至 20，恢复正常",
  "[2026-08-05 09:25:44] [DEBUG] cache: 刷新 key user:1001，TTL 300s",
  "[2026-08-05 09:12:03] [INFO]  auth: 用户 alice 登录成功",
  "[2026-08-05 09:12:47] [INFO]  order: 创建订单 #10231，金额 ¥299.00",
  "[2026-08-05 09:13:15] [WARN]  cache: 缓存命中率下降至 62%，建议检查热点 key",
  "[2026-08-05 09:14:02] [ERROR] payment: 支付网关超时，订单 #10231 回滚",
  "[2026-08-05 09:14:05] [INFO]  payment: 订单 #10231 已自动重试",
  "[2026-08-05 09:15:38] [DEBUG] db: SQL 执行耗时 128ms: SELECT * FROM users WHERE id=?",
  "[2026-08-05 09:16:20] [INFO]  auth: 用户 bob 登录成功",
  "[2026-08-05 09:17:11] [WARN]  system: 内存使用率 85%，接近告警阈值",
  "[2026-08-05 09:18:44] [ERROR] api: 接口 /api/v1/report 返回 500，重试 3 次失败",
  "[2026-08-05 09:19:59] [INFO]  job: 定时任务 daily-report 执行完成，处理 1420 条记录,job: 定时任务 daily-report 执行完成，处理 1420 条记录",
  "[2026-08-05 09:21:07] [INFO]  auth: 用户 carol 登录成功",
  "[2026-08-05 09:22:33] [WARN]  network: 与节点 10.0.0.5 心跳延迟 480ms",
  "[2026-08-05 09:23:50] [ERROR] db: 数据库连接池耗尽，等待可用连接",
  "[2026-08-05 09:24:12] [INFO]  db: 连接池已扩容至 20，恢复正常",
  "[2026-08-05 09:25:44] [DEBUG] cache: 刷新 key user:1001，TTL 300s",
  "[2026-08-05 09:12:03] [INFO]  auth: 用户 alice 登录成功",
  "[2026-08-05 09:12:47] [INFO]  order: 创建订单 #10231，金额 ¥299.00",
  "[2026-08-05 09:13:15] [WARN]  cache: 缓存命中率下降至 62%，建议检查热点 key",
  "[2026-08-05 09:14:02] [ERROR] payment: 支付网关超时，订单 #10231 回滚",
  "[2026-08-05 09:14:05] [INFO]  payment: 订单 #10231 已自动重试",
  "[2026-08-05 09:15:38] [DEBUG] db: SQL 执行耗时 128ms: SELECT * FROM users WHERE id=?",
  "[2026-08-05 09:16:20] [INFO]  auth: 用户 bob 登录成功",
  "[2026-08-05 09:17:11] [WARN]  system: 内存使用率 85%，接近告警阈值",
  "[2026-08-05 09:18:44] [ERROR] api: 接口 /api/v1/report 返回 500，重试 3 次失败",
  "[2026-08-05 09:19:59] [INFO]  job: 定时任务 daily-report 执行完成，处理 1420 条记录,job: 定时任务 daily-report 执行完成，处理 1420 条记录",
  "[2026-08-05 09:21:07] [INFO]  auth: 用户 carol 登录成功",
  "[2026-08-05 09:22:33] [WARN]  network: 与节点 10.0.0.5 心跳延迟 480ms",
  "[2026-08-05 09:23:50] [ERROR] db: 数据库连接池耗尽，等待可用连接",
  "[2026-08-05 09:24:12] [INFO]  db: 连接池已扩容至 20，恢复正常",
  "[2026-08-05 09:25:44] [DEBUG] cache: 刷新 key user:1001，TTL 300s",
];

const logss = [
  ...logs, ...logs, ...logs, ...logs, ...logs, ...logs, ...logs, ...logs, ...logs, ...logs, ...logs, ...logs, ...logs, ...logs
].map(item => ({id: `${Math.random()}`, text: item}))

export default function() {
  const { rows, columns } = useStdoutDimensions();
  const [leftOffset, setLeftOffset] = useState(0);
  const [rightOffset, setRightOffset] = useState(0);
  const [leftBoxWidth, setLeftBoxWidth] = useState(columns / 2 - 1);
  const [showSuggestionBox, setShowSuggestionBox] = useState(true);
  const hideSuggestionBoxTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [inputValue, setInputValue] = useState('');
  const currentFocusBox = useRef(0);
  const { exit } = useApp();
  
  const inputBoxHeight = 5;

  const hideSuggestionBox = () => {
    setShowSuggestionBox(false);
    if (hideSuggestionBoxTimer.current) {
      clearTimeout(hideSuggestionBoxTimer.current);
    }
  }

  useInput((ch, key) => {
    if (key.escape && showSuggestionBox) {
      hideSuggestionBox();
      return;
    }

    if (!showSuggestionBox && (key.escape || key.ctrl && (ch === 'c' || ch === 'C'))) {
      exit();
      return;
    }

    if (showSuggestionBox) return;

    if (key.upArrow || key.downArrow) {
      const currentOffset = currentFocusBox.current === 0 ? leftOffset : rightOffset;
      const setter = currentFocusBox.current === 0 ? setLeftOffset : setRightOffset;
      const newOffset = key.upArrow ? currentOffset - 1 : currentOffset + 1;
      if (newOffset >= 0 && newOffset < logss.length) {
        setter(newOffset);
      }
      return;
    }

    if (key.leftArrow || key.rightArrow) {
      if (key.leftArrow && currentFocusBox.current === 1) {
        currentFocusBox.current = 0;
      } else if (key.rightArrow && currentFocusBox.current === 0) {
        currentFocusBox.current = 1;
      } else { // same direction
        const newLeftBoxWidth = key.leftArrow ? leftBoxWidth - 10 : leftBoxWidth + 10;
        if (newLeftBoxWidth > columns * 0.1 && newLeftBoxWidth < columns * 0.9) {
          setLeftBoxWidth(newLeftBoxWidth);
        }
      }
      return;
    }
  })

  const handleSubmit = (value: string) => {
    value = value.trim();
    if (value === '') {
      return;
    }
    onInputChange(value);
  }

  const onInputChange = (value: string) => {
    setInputValue(value);
    setShowInputBox(true);
    if (hiddenInputBoxTimer.current) {
      clearTimeout(hiddenInputBoxTimer.current);
    }
    hiddenInputBoxTimer.current = setTimeout(() => {
      setShowInputBox(false);
      hiddenInputBoxTimer.current = null;
    }, 5000);
  }

  useEffect(() => {
    hiddenInputBoxTimer.current = setTimeout(() => {
      setShowInputBox(false);
      hiddenInputBoxTimer.current = null;
    }, 5000);
    return () => {
      if (hiddenInputBoxTimer.current) {
        clearTimeout(hiddenInputBoxTimer.current);
        hiddenInputBoxTimer.current = null;
      }
    }
  }, []);

  return (
    <Box flexDirection='column'>
      <Box flexDirection='row' columnGap={1}>
        <ScrollBox 
          title={' Chat Log '} 
          buffer={logss} 
          showOffset={leftOffset} 
          width={leftBoxWidth}
          height={showInputBox ? rows - inputBoxHeight : rows}

        />
        <ScrollBox
          title={' Logger Log '} 
          buffer={logss}
          showOffset={rightOffset}
          width={columns - leftBoxWidth - 1}
          height={showInputBox ? rows - inputBoxHeight : rows}
        />
      </Box>
      {showInputBox && (
        <ContainerBox title='Input' width={columns} height={inputBoxHeight}>
          <TextInput value={inputValue} onChange={onInputChange} onSubmit={handleSubmit} />
        </ContainerBox>
      )}
    </Box>
  )
}