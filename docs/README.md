<div align="center"><center>

<img alt="Icon" src="../resources/icon.png" width="200">

# NineteenBot

<p align="center">
  <a href="https://github.com/PrismarineJS/mineflayer"><img alt="mineflayer" src="https://img.shields.io/badge/mineflayer-000000?logo=github&logoColor=white&labelColor=black&color=white"></a>
  <a href="https://deepwiki.com/TAOtxi/NineteenBot"><img alt="Ask DeepWiki" src="https://deepwiki.com/badge.svg"></a>
</p>
</center></div>

## 指南

使用流程：
1. 运行 `npm i` 安装依赖.
2. 运行 `npm run fix` 修复一些 `mineflayer` 存在但未修复的问题.
3. 配置 `config/config.json` 文件.
4. 运行 `npm run start` 启动.

### 账号配置
将 `config/config_template.json` 重命名为 `config/config.json`，并自行配置账号和服务器信息。其中 `mainAccount` 需要设置为你的主账号，用于某些命令的缺省值。比如 `q tp` 命令，使用 `/tpa` 命令传送至 `${mainAccount}`。

### 插件
另见 [plugins.md](./plugins.md)

### 操作命令

#### 基础命令

| 命令 | 别名 | 说明 |
|------|------|------|
| `quit` | - | 退出当前bot |
| `exit` | - | 退出所有bot |
| `restart` | - | 重启当前bot |
| `all <command>` | - | 在所有bot上执行命令 |
| `who` | - | 显示当前bot标识符，标识符结构为 `username@servername` |
| `list` | - | 显示在线玩家 |
| `tps` | - | 显示当前TPS |
| `help` | - | 帮助命令 |
| `msg <msg>` | `chat` \| `.` | 发送聊天消息 |

#### Bot管理

| 命令 | 别名 | 说明 |
|------|------|------|
| `bot create` | - | 创建新bot |
| `bot change <identity>` | - | 将指定bot切换到前台 |

#### 快捷命令 `q`

| 命令 | 别名 | 说明 |
|------|------|------|
| `q inv` | - | 查看背包内容 |
| `q cont` | - | 查看打开的容器内容 |
| `q h` | `q harvest` | 向主账号展示匹配物品 |
| `q 1` | - | 传送至`净土` |
| `q 2` | - | 传送至`乐土` |
| `q 3` | - | 传送至`工业服` |
| `q tp` | - | 请求传送至[指定玩家](../src/module/command.ts#L97) |
| `q fish on` | - | 所有bot开启钓鱼 |
| `q fish stop` | - | 所有bot停止钓鱼 |
| `q clean` | `all 'fish clean'` | 所有bot向最近的管理员或玩家丢弃匹配通过的物品(`fishman` + `autodrop` 插件) |
| `q drop` | `all 'ad test'` | 所有bot丢弃背包内匹配失败的物品(`autodrop` 插件) |
| `q sign` | `all 'task apply signIn'` | 所有bot执行自动签到[任务](./task.md) |
| `q water` | `all 'task apply water'` | 所有bot执行自动浇水[任务](./task.md) |
| `q usage` | - | 所有bot向[指定玩家](/src/module/command.ts#L131)私聊背包剩余空间 |
| `q next` | - | 切换到下一个bot |
| `q select` | - | 将bot切换到前台 |

#### 状态命令 `state`

| 命令 | 别名 | 说明 |
|------|------|------|
| `state getYawPitch` | - | 获取yaw/pitch状态 |
| `state get <property>` | - | 获取bot属性(原Object对象) |
| `state getStr <property>` | - | 获取bot属性(字符串形式) |