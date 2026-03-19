# NineteenBot
OHHHHHHHHH


![logo](./resources/logo.png)

## 命令
```text
quit                  # 关闭程序
cls | clear           # 清除控制台
list                  # 列出玩家列表
. <message>           # 发送消息到聊天框
/<cmd>                # 像游戏那样正常发送指令

act                        # 显示所有可执行的动作
act info                   # 打印 bot 当前动作状态
act stop  [action]         # 停止所有动作或某个动作
act look                   # 视线跟踪最近的玩家
act spin  [-a <angle>]     # 开启旋转动作，可选参数为每 tick 旋转角度，默认值为 36 度
act jump  [-i <interval>]  # 开启跳跃动作，可选参数为跳跃间隔，默认值为 3 tick
act sneak [-i <interval>]  # 开启潜行动作，可选参数为潜行间隔，默认值为 7 tick
act swing [-i <interval>]  # 开启挥手动作，可选参数为挥手间隔，默认值为 7 tick
act fun                    # 组合动作，跳跃+潜行+挥手，玩家靠近6格以内时，视线跟踪玩家，否则一直转圈圈。

info stat                           # 统计实体数量

info <e | entity>                   # 筛选实体
    -id, --identifier <entityId>:   # 筛选实体ID  (name)
    -n, --name <name>:              # 筛选实体名字 (displayName)
    -c, --count <number>:           # 筛选实体数量
    -at, --attribute <attr>:        # 筛选实体属性
    -desc, --descending             # 按距离降序排序，不指定则默认为升序
    -d, --distance <number>:        # 筛选实体距离

info <inv | inventory>              # 打印 bot 背包
    show                            # 合并背包同类物品，并打印带有翻译的统计信息
    -s, --slot <slot>:              # 打印指定槽位的物品信息
    -id, --identifier <itemId>:     # 打印指定物品ID的物品信息
    -n, --name <name>:              # 打印指定物品名称的物品信息
    -e, --enchant <enchant>:        # 打印带有指定附魔的物品信息
    -at, --attribute <attr>:        # 打印带有指定属性的物品信息

bh | behavior                       # bot的状态相关命令
   look -r, --rotate <yaw,pitch>    # 指定 bot 的视角
   look -p, --position <x,y,z>      # 指定 bot 视角所看的位置
   fish                             # 钓鱼
   get <attribute>                  # 获取 bot 的属性值
   set -p, --physicsEnabled <bool>  # 设置 bot 的 physicsEnabled
```