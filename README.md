# NineteenBot
OHHHHHHHHH


![logo](./logo.png)

## 命令
```bash
quit                  # 关闭程序
rc                    # 重新连接   (现在好像用不上了)
cls | clear           # 清除控制台
list                  # 列出玩家列表
. [message]           # 发送消息到聊天框
info entity           # 显示客户端所有实体
info count            # 显示客户端所有实体的数量统计  (并不完善，有一些实体统计不准确，还不能翻译)
/<cmd>                # 像游戏那样正常发送指令

act                   # 显示所有可执行的动作
act info              # 打印bot当前动作状态
act stop              # 停止所有动作
act look              # 视线跟踪最近的玩家
act spin  [degree]    # 开启旋转动作，可选参数为每 tick 旋转角度，默认值为 36 度
act jump  [interval]  # 开启跳跃动作，可选参数为跳跃间隔，默认值为 3 tick
act sneak [interval]  # 开启潜行动作，可选参数为潜行间隔，默认值为 7 tick
act swing [interval]  # 开启挥手动作，可选参数为挥手间隔，默认值为 7 tick
act fun               # 组合动作，跳跃+潜行+挥手，玩家靠近6格以内时，视线跟踪玩家，否则一直转圈圈。



```