# Plugin

## 说明
插件用于扩展 `bot` 的功能，在 `NineteenBot` 中，因为有些插件需要依赖于其它插件，所以需要按顺序加载插件。但实际开发中，不可能记住所有插件的加载顺序，更不要说使用者了。因此为了解决此问题，写了个插件等待加载机制，详细请查阅：[pluginWaiter](/src/utils/pluginWaiter.ts)

### 插件列表

[action](#action)
[anvil](#anvil)
[autoattack](#autoattack)
[autodrop](#autodrop)
[autorepair](#autorepair)
[fishman](#fishman)
[helper](#helper)
[infomation](#infomation)
[initTask](#initTask)
[logger](#logger)
[makeConfig](#makeConfig)
[menuClick](#menuClick)
[task](#task)
[tps](#tps)
[tpsChecker](#tpsChecker)

### 介绍

#### action
执行一些简单的动作。没错，大厅陀螺就是这个插件的功能，不过现在大厅有反作弊了，转不起来了。<br>
命令为 `action`，别名 `act`。
| 子命令 | 说明 |
|------|------|
| `help` | 显示帮助信息 |
| `stop <actionType>` | 停止指定动作，动作类型若省略，则停止所有动作。 |
| `spin [-a/--angle <angle>]` | 转圈圈，参数为每tick旋转角度，可选，默认角度为 36 度。 |
| `jump [-i/--interval <interval>]` | 跳跃，参数为跳跃间隔，可选，默认间隔为 3 秒。 |
| `sneak [-i/--interval <interval>]` | 潜行，参数为潜行间隔，可选，默认间隔为 7 秒。 |
| `swing [-i/--interval <interval>]` | 挥手，参数为挥手间隔，可选，默认间隔为 7 秒。 |
| `track` | 视野跟踪最近玩家。 |
| `spec <Type>` | 组合动作，目前仅有陀螺 `fun`，也就是转圈+跳跃+潜行+挥手。 |
| `look <Args>` | 设置玩家的视角，参数有 1. 方向：`-d, --direction`，可选值有 `up`, `down`, `south`, `north`, `west`, `east`。2. 视野角度： `-r, --rotation`，格式为 `<yaw, pitch>`。3. 方块坐标：`-b, --block`，格式为 `<x, y, z>`。 4. 玩家: `-p, --player`，值为玩家名字。 |

#### anvil
铁砧相关，只有合并的功能，为了 `autorepair` 插件而写的，`mineflayer` 自带的 `anvil` 插件有问题。这里不多介绍。

#### autoattack
根据服务器tps自动调整攻击间隔。<br>
命令为 `autoattack`，别名 `attack`。
| 子命令 | 说明 |
|------|------|
| `start` | 启动自动攻击 |
| `stop` | 停止自动攻击 |
| `info` | 显示攻击信息 |

#### autodrop
自动清理背包内匹配失败的物品，不多介绍。<br>
核心命令：`ad on`，`ad off`。详细命令请查阅[代码](/src/plugins/autodrop.ts#L262)

#### autorepair
自动为合金装备附魔经验修补。<br>
核心命令：`repair on`，`repair off`。详细命令请查阅[代码](/src/plugins/autorepair.ts#L358)
流程（AI写的，仅供参考）：<br>
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
吸取到经验球时，自动将背包内耐久未满，且带有经验修补的装备替换到副手。<br>
核心命令：`autoreplace on`，`autoreplace off`。

#### command
向 `Java` 客户端那样注册命令。快成屎山了，不多赘述。<br>
目前的可注册类型有：<br>
- `command` 命令及子命令
- `argument` 命令参数
- `value` 命令值

#### control
控制一些操作，目前还未完善。<br>
命令请查阅[代码](/src/plugins/control.ts#L76)
支持操作有：
- 丢背包内指定位置的物品
- 打开指定位置的容器
- 切换主手
- 交换背包内物品的位置

#### fishman
自动钓鱼。<br>
| 命令 | 别名 | 说明 |
|------|------|------|
| `fish activate` | - | 激活钓鱼竿 |
| `fish on` | - | 开启自动钓鱼 |
| `fish off` | - | 关闭自动钓鱼 |
| `fish bobber` | - | 显示浮标信息 |
| `fish rotation on` | - | 开启自动转向 |
| `fish rotation off` | - | 关闭自动转向 |
| `fish rotation add <yaw,pitch>` | - | 添加转向角度 |
| `fish rotation clear` | - | 清除转向设置 |
| `fish config reload` | - | 重新加载配置 |
| `fish config reset` | - | 重置配置 |
| `fish config show <prop>` | - | 显示配置属性 |

#### infomation
信息插件。<br>

| 命令 | 别名 | 说明 |
|------|------|------|
| `info inv [-cde]` | `info inventory` | 查看背包(-c数量/-d耐久/-e附魔) |
| `info cont [-cde]` | `info container` | 查看容器 |
| `info item hand [-r]` | - | 查看手持物品(-r原始信息) |
| `info item slot <slot>` | - | 查看指定槽位物品 |
| `info e [options]` | `info entity` | 查看实体信息 |
| `info show matchItems <player>` | - | 向玩家展示匹配物品 |
| `info stat` | - | 显示实体统计 |

目前功能有：
- 显示背包物品，包括速览以及完整的数据
- 显示容器物品，包括速览以及完整的数据
- 显示实体信息，可筛选实体属性
- 统计实体数量

#### initTask
初始化任务插件，在每次创建bot时，都会根据任务缓存队列初始化任务。<br>
主要用于bot掉线重连后，继续执行之前的任务。

#### logger
日志插件。

#### makeConfig
配置插件。

#### menuClick
模拟鼠标操作点击菜单。

#### task
任务队列插件。<br>
常用于创建循环任务以及延时任务。

#### tps
预估服务器tps。

#### tpsChecker
在服务器tps过低时，执行指定命令。tps回升后，执行另外的命令。<br>
用于安全挂机。