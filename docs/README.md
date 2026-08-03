<div align="center"><center>

<img alt="Icon" src="../resources/icon.png" width="200">

# NineteenBot

基于 [mineflayer](https://github.com/PrismarineJS/mineflayer) 的多账号 Minecraft 机器人框架，支持插件化扩展与终端面板管理。

<p align="center">
  <a href="https://github.com/PrismarineJS/mineflayer"><img alt="mineflayer" src="https://img.shields.io/badge/mineflayer-000000?logo=github&logoColor=white&labelColor=black&color=white"></a>
  <a href="https://deepwiki.com/TAOtxi/NineteenBot"><img alt="Ask DeepWiki" src="https://deepwiki.com/badge.svg"></a>
</p>
</center></div>

## 目录

- [快速开始](#快速开始)
- [账号配置](#账号配置)
- [脚本命令](#脚本命令)
- [插件](#插件)
- [操作命令](#操作命令)
  - [基础命令](#基础命令)
  - [Bot 管理](#bot-管理)
  - [快捷命令 `q`](#快捷命令-q)
  - [状态命令 `state`](#状态命令-state)

## 快速开始

1. 运行 `npm i` 安装依赖。
2. 运行 `npm run fix` 修复一些 `mineflayer` 存在但未修复的问题。
3. 配置 `config/config.json` 文件（见 [账号配置](#账号配置)）。
4. 运行 `npm run start` 启动。

## 账号配置

将 `config/config_template.json` 重命名为 `config/config.json`，并自行配置账号和服务器信息。

主要字段说明：

| 字段 | 说明 |
|------|------|
| `Users` | 账号列表，键为 bot 名称，值包含 `account`（登录邮箱）等信息 |
| `Servers` | 服务器列表，包含 `host`、`port`、`version`、`auth` 等 |
| `Admin` | 管理员玩家名列表，管理员玩家可通过私聊方式向bot发送命令 |
| `mainAccount` | 主账号，用作某些命令的缺省值。比如 `q tp` 会使用 `/tpa` 传送至 `${mainAccount}` |

## 脚本命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 编译并启动（带终端面板） |
| `npm run panel` | 启动独立面板，不包含bot |
| `npm run inspect` | 以 `--inspect` 调试模式启动 |
| `npm run build` | 仅编译代码（`tsc` + `tsc-alias`） |
| `npm run fix` | 修复 `mineflayer` 部分已知，但未修复的问题 |
| `npm run test` | 无面板模式启动某个账号，用于测试 |
| `npm run fast` | 跳过面板选择账号流程，直接启动某个账号 |

## 插件

插件用于扩展 bot 的功能，详见 [plugins.md](./plugins.md)。

## 操作命令

### 基础命令

| 命令 | 别名 | 说明 |
|------|------|------|
| `quit` | - | 退出当前 bot |
| `exit` | - | 退出所有 bot |
| `all <command>` | - | 在所有 bot 上执行命令 |
| `who` | `w` | - | 显示当前 bot 标识符，结构为 `username@servername` |
| `list` | `ls` | 显示在线玩家 |
| `tps` | - | 显示当前 TPS |
| `help` | - | 帮助命令 |
| `msg <msg>` | `chat <msg>` \| `. <msg>` | 发送聊天消息，若消息带有空格，需用引号括起来 |

### Bot 管理

| 命令 | 别名 | 说明 |
|------|------|------|
| `bot create` | - | 创建新 bot (面板界面选择) |
| `bot change <identity>` | - | 将指定 bot 切换到前台 |

### 快捷命令 `q`

| 命令 | 别名 | 说明 |
|------|------|------|
| `q inv` | `q inventory` | 查看背包内容 |
| `q cont` | `q container` | 查看打开的容器内容 |
| `q h` | `q harvest` | 向主账号展示匹配物品 |
| `q 1` | - | 传送至 `净土` |
| `q 2` | - | 传送至 `乐土` |
| `q 3` | - | 传送至 `工业服` |
| `q tp` | - | 请求传送至主账号玩家 |
| `q fish on` | - | 所有 bot 开启钓鱼 |
| `q fish stop` | - | 所有 bot 停止钓鱼 |
| `q clean` | `all 'fish clean'` | 所有 bot 向最近的管理员或玩家丢弃匹配通过的物品（`fishman` + `autodrop` 插件） |
| `q drop` | `all 'ad test'` | 所有 bot 丢弃背包内匹配失败的物品（`autodrop` 插件） |
| `q sign` | `all 'task apply signIn'` | 所有 bot 执行[自动签到任务](./task.md) |
| `q water` | `all 'task apply water'` | 所有 bot 执行[自动浇水任务](./task.md) |
| `q usage` | - | 所有 bot 向主账号玩家私聊背包剩余空间 |
| `q next` | - | 切换到下一个 bot |
| `q select` | - | 将 bot 切换到前台 |

### 状态命令 `state`

| 命令 | 别名 | 说明 |
|------|------|------|
| `state getYawPitch` | - | 获取 yaw/pitch 状态 |
| `state get <property>` | - | 获取 bot 属性（字符串形式） |
