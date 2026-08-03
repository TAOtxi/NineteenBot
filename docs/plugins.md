# Plugin

## 说明

插件用于扩展 `bot` 的功能。在 `NineteenBot` 中，因为有些插件需要依赖于其它插件，所以需要按顺序加载插件。<br>
但实际开发中，不可能记住所有插件的加载顺序，更不要说使用者了。因此为了解决此问题，写了个插件等待加载机制，详细请查阅：[pluginWaiter](/src/utils/pluginWaiter.ts)。

大部分插件通过 `command` 插件注册命令，命令支持 `子命令 / 参数 / 值` 三种形式，输入 `<插件命令> help` 或不带参数执行通常可查看帮助。

### 插件列表

| 插件 | 功能 | 主命令 |
|------|------|--------|
| [action](#action) | 执行简单动作（转圈、跳跃、潜行等） | `action` / `act` |
| [anvil](#anvil) | 铁砧合并功能（供 `autorepair` 使用） | 无（提供 API） |
| [autoattack](#autoattack) | 按 TPS 自动调整攻击间隔 | `autoattack` / `attack` |
| [autodrop](#autodrop) | 按匹配规则自动清理背包 | `autodrop` / `ad` |
| [autorepair](#autorepair) | 自动为合金装备附魔经验修补 | `autorepair` / `repair` |
| [autoreplace](#autoreplace) | 自动将耐久未满的经验修补装备换到副手 | `autoreplace` / `replace` |
| [command](#command) | 命令注册框架 | 无（提供 API） |
| [control](#control) | 控制丢物品、开容器、切主手等操作 | `control` / `c` |
| [fishman](#fishman) | 自动钓鱼 | `fish` |
| [infomation](#infomation) | 查看背包、容器、实体等信息 | `info` |
| [initTask](#inittask) | 任务缓存与初始化（掉线重连续跑任务） | `task` |
| [logger](#logger) | 日志 | 无（提供 API） |
| [makeConfig](#makeconfig) | 配置读写 | 无（提供 API） |
| [menuClick](#menuclick) | 模拟鼠标点击菜单 | `clicker` |
| [playerListManager](#playerlistmanager) | 玩家上下线监听 | 无（提供事件） |
| [task](#task) | 任务队列（定时 / 延时任务） | 无（提供 API） |
| [tps](#tps) | 预估服务器 TPS | 无（提供 API） |
| [tpsChecker](#tpschecker) | TPS 过低时执行指定命令 | `tpsChecker` |

### 介绍

#### action

执行一些简单的动作。没错，大厅陀螺就是这个插件的功能，不过现在大厅有反作弊了，转不起来了。<br>
命令为 `action`，别名 `act`。

| 子命令 | 说明 |
|------|------|
| `help` | 显示帮助信息 |
| `stop <actionType>` | 停止指定动作，动作类型若省略，则停止所有动作 |
| `spin [-a/--angle <angle>]` | 转圈圈，参数为每 tick 旋转角度，可选，默认 36 度 |
| `jump [-i/--interval <interval>]` | 跳跃，参数为跳跃间隔，可选，默认 3 秒 |
| `sneak [-i/--interval <interval>]` | 潜行，参数为潜行间隔，可选，默认 7 秒 |
| `swing [-i/--interval <interval>]` | 挥手，参数为挥手间隔，可选，默认 7 秒 |
| `track` | 视野跟踪最近玩家 |
| `spec <Type>` | 组合动作，目前仅有陀螺 `fun`，即转圈 + 跳跃 + 潜行 + 挥手 |
| `look <Args>` | 设置玩家视角，参数：1. 方向 `-d, --direction`（`up`/`down`/`south`/`north`/`west`/`east`）；2. 视野角度 `-r, --rotation`，格式 `<yaw, pitch>`；3. 方块坐标 `-b, --block`，格式 `<x, y, z>`；4. 玩家 `-p, --player`，值为玩家名 |

#### anvil

铁砧相关，只有合并的功能，为了 `autorepair` 插件而写的（`mineflayer` 自带的 `anvil` 插件有问题）。<br>
不注册命令，向 bot 挂载 `openNearstAnvil`、`findNearestAnvilBlock`、`anvilCombine` 等 API。

#### autoattack

根据服务器 TPS 自动调整攻击间隔。<br>
命令为 `autoattack`，别名 `attack`。

| 子命令 | 说明 |
|------|------|
| `start` | 启动自动攻击 |
| `stop` | 停止自动攻击 |
| `info` | 显示攻击信息 |

#### autodrop

自动清理背包内匹配失败（或匹配成功，取决于模式）的物品。<br>
命令为 `autodrop`，别名 `ad`。

| 子命令 | 说明 |
|------|------|
| `on` | 开启自动丢弃 |
| `off` | 关闭自动丢弃 |
| `test` | 立即执行一次丢弃检查（忽略非空槽位阈值） |
| `ignore current` | 将当前所有非空槽位加入忽略列表 |
| `ignore reset` | 清空忽略列表 |
| `ignore add <slot1,slot2...>` | 追加忽略槽位 |
| `ignore set <slot1,slot2...>` | 覆盖设置忽略槽位 |
| `set -it/--interval <tick>` | 设置触发间隔（tick） |
| `set -m/--mode <whitelist\|blacklist>` | 设置丢弃模式（白名单 = 丢匹配失败，黑名单 = 丢匹配成功） |
| `set -d/--direction <dir>` | 设置丢弃朝向（`north`/`south`/`east`/`west`/`up`/`down`/`looking`） |
| `set -r/--rotation <yaw,pitch>` | 设置丢弃视角 |
| `set --dropWay <direction\|rotation>` | 设置按朝向还是按视角丢弃 |
| `config show <property>` | 显示指定配置项 |
| `config reload` | 重新加载配置 |

匹配规则（`items` 配置）支持按 `name`（名称，支持正则）、`id`（物品 ID，支持正则）、`durability`（耐久）、`enchants`（附魔及等级）、`minEntCounts`（最少命中附魔数）筛选，详见[配置类型定义](/src/plugins/autodrop.ts#L472)。

#### autorepair

自动为合金装备附魔经验修补。<br>
命令为 `autorepair`，别名 `repair`。。

| 子命令 | 说明 |
|------|------|
| `on` | 开启自动修补 |
| `off` | 关闭自动修补 |
| `state` | 显示当前状态（取装备 / 取书 / 修复 / 合并中） |
| `canGetEquipmentFromContainer on` | 允许从容器取装备 |
| `canGetEquipmentFromContainer off` | 禁止从容器取装备 |
| `mendingBookPos <x, y, z>` | 设置经验修补书容器坐标 |

流程（AI 写的，仅供参考）：<br>

```txt
开始
  ├─ 并发检查 → 通过
  ├─ 经验检查 → 通过
  ├─ 若打开了容器 → 关闭容器
  ├─ 统计装备和空槽
  ├─ [背包无装备 + 允许取装备] → 从容器取装备 → 结束
  ├─ [背包有装备]
  │   ├─ 统计需修复装备和附魔书
  │   ├─ 无装备可修 → 结束
  │   ├─ [有装备但无附魔书] → 从容器取附魔书 → 结束
  │   └─ [有装备且有附魔书]
  │       ├─ 找铁砧 → 找不到 → 结束
  │       └─ 找到铁砧 → 尝试附魔 → 结束
```

#### autoreplace

吸取到经验球时，自动将背包内耐久未满、且带有经验修补的装备替换到副手。<br>
命令为 `autoreplace`，别名 `replace`。

| 子命令 | 说明 |
|------|------|
| `on` | 开启自动替换 |
| `off` | 关闭自动替换 |

#### command

像 `Java` 客户端那样注册命令。快成屎山了，不多赘述。<br>
目前的可注册类型有：

- `command` 命令及子命令
- `argument` 命令参数
- `value` 命令值

#### control

控制一些操作，目前还未完善。<br>
命令为 `control`，别名 `c`。

| 子命令 | 说明 |
|------|------|
| `moveSlot <slot1, slot2>` | 交换背包内两个槽位的物品 |
| `drop slot <Slot>` | 丢弃指定槽位物品 |
| `drop hand` | 丢弃当前手持物品 |
| `open container nearst` | 打开最近的容器 |
| `open container at <x,y,z>` | 打开指定坐标的容器 |
| `open block <x,y,z>` | 打开指定坐标的方块（如工作台、铁砧等） |
| `quickBar <Slot>` | 切换主手快捷栏（0-8） |
| `close` | 关闭当前窗口 |
| `close <WindowId>` | 关闭指定窗口 |

#### fishman

自动钓鱼。<br>
命令为 `fish`。

| 命令 | 说明 |
|------|------|
| `fish activate` | 激活钓鱼竿 |
| `fish on` | 开启自动钓鱼 |
| `fish off` | 关闭自动钓鱼 |
| `fish bobber` | 显示浮标信息 |
| `fish rotation on` | 开启自动转向 |
| `fish rotation off` | 关闭自动转向 |
| `fish rotation add <yaw,pitch>` | 添加转向角度 |
| `fish rotation clear` | 清除转向设置 |
| `fish config reload` | 重新加载配置 |
| `fish config reset` | 重置配置 |
| `fish config show <prop>` | 显示配置属性 |

#### infomation

信息插件。<br>
命令为 `info`。

| 命令 | 别名 | 说明 |
|------|------|------|
| `info inv [-cde]` | `info inventory` | 查看背包，参数为需要展示的词条类型（`-c` 数量 / `-d` 耐久 / `-e` 附魔） |
| `info cont [-cde]` | `info container` | 查看容器，参数同上 |
| `info item hand [-r]` | - | 查看手持物品（`-r` 输出原始Json） |
| `info item slot <slot>` | - | 查看指定槽位物品 |
| `info e [options]` | `info entity` | 查看实体信息， 详细参数见[代码](/src/plugins/infomation.ts#L309) |
| `info show matchItems <player>` | - | 向玩家展示匹配物品 |
| `info stat` | - | 显示实体统计 |

目前功能有：

- 显示背包物品，包括速览以及完整数据
- 显示容器物品，包括速览以及完整数据
- 显示实体信息，可筛选实体属性
- 统计实体数量

#### initTask

初始化任务插件，在每次创建 bot 时，都会根据任务缓存队列初始化任务。<br>
主要用于 bot 掉线重连后，继续执行之前的任务。命令为 `task`（任务缓存管理）。

| 子命令 | 说明 |
|------|------|
| `task list` | 显示当前时间任务列表 |
| `task apply <task>` | 立即执行一个任务（不加入缓存） |
| `task add <task>` | 将任务加入缓存队列（不立即执行） |
| `task do <task>` | 加入缓存并立即执行 |
| `task remove <task>` | 从缓存队列移除任务 |

> 可用任务名由各任务模块通过 `registerTask` 注册，输入时会自动补全。

#### logger

日志插件。<br>
向 bot 挂载 `baseInfo` / `baseWarn` / `baseError` / `chatLog` 等 API，日志按天分文件保存到 `./log/<username>/`，单文件上限 10MB。

#### makeConfig

配置插件。<br>
向 bot 挂载 `loadConfig` / `saveConfig` / `getConfig` / `setConfig` 等 API。配置以命名空间（插件名）为单位存储在 `./config/` 下，支持按账号覆盖的私有配置（`./config/<username>/`）。

#### menuClick

模拟鼠标操作点击菜单。<br>
命令为 `clicker`。

| 子命令 | 说明 |
|------|------|
| `clicker run <task>` | 运行配置中定义的点击任务 |

任务在配置文件中定义，每个任务包含 `name`、`isLoop`、`startDelay`、`delay` 及 `actions` 列表。`actions` 每项可以是点击动作（如 `pickup 0 <slot>`）或以 `/` 开头的命令。

#### playerListManager

玩家上下线监听。通过匹配聊天消息中的进出服提示，维护在线玩家表，并向 bot 派发 `playerJoin` / `playerLeave` 事件（带 5 秒防抖，避免切服抖动误报）。<br>
不注册命令，供其它插件监听事件使用。

#### task

任务队列插件。<br>
常用于创建循环任务以及延时任务。不注册命令，向 bot 挂载定时 / tick 任务相关 API：

- `createTimeTask` / `createOnceTimeTask`：创建循环 / 一次性定时任务
- `updateTimeTask` / `restartTimeTask` / `removeTimeTask`：更新 / 重启 / 移除定时任务
- `createTickTask` / `updateTickTask` / `removeTickTask`：tick 级任务
- `throttle`：节流执行
- `hasTimeTask` / `hasTickTask`：查询任务是否存在

> 创建任务需要保证任务名唯一，否则会报错。

#### tps

预估服务器 TPS。<br>
基于 `update_time` 包统计，向 bot 挂载 `getTps`（每秒 tick 数）与 `getMsTps`（每 tick 毫秒数）API。

#### tpsChecker

在服务器 TPS 过低时，执行指定命令；TPS 回升后，执行另外的命令。用于安全挂机。<br>
命令为 `tpsChecker`。

| 子命令 | 说明 |
|------|------|
| `enable` | 启用 TPS 监控 |
| `disable` | 停用 TPS 监控 |
| `threshold <threshold>` | 设置触发命令的 TPS 阈值 |

默认配置：TPS 低于 `tpsThreshold`（默认 10）执行 `triggerCommand`（默认 `/spawn`）；回升到 `greenThreshold`（默认 17）执行 `greenTriggerCommand`（默认 `/back`）。
