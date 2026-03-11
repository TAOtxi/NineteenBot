import mineflayer from 'mineflayer';
import { Vec3 } from 'vec3';

class BotAction {
  private ticker = 0;
  private actionEnable = false;
  private watchPlayerEnable = false;

  private spinEnable = false;
  private spinDeltaYaw = Math.PI / 5;

  private jumpEnable = false;
  private nextJumpTick = 0;
  private jumpInterval = 3;

  private sneakEnable = false;
  private nextSneakTick = 0;
  private sneakInterval = 7;

  private swingEnable = false;
  private nextSwingArmTick = 0;
  private swingArmInterval = 7;

  private bot: mineflayer.Bot | null = null;

  public setBot(bot: mineflayer.Bot) {
    this.bot = bot;
  }

  public enableAction() {
    this.actionEnable = true;
  }

  public disableAction() {
    this.actionEnable = false;
  }

  public setAction(msg: string) {
    const msgArr = msg.split(' ').filter((item) => item !== '');
    const cmd = msgArr[0];

    switch (cmd) {
      case 'start':
        this.enableAction();
        break;

      case 'stop':
        this.stop();
        break;

      case 'spin':
        this.spinEnable = true;
        if (msgArr[1] !== undefined) {
          this.spinDeltaYaw = parseFloat(msgArr[1]) / 180 * Math.PI;
        }
        break;

      case 'watchPlayer':
        this.watchPlayerEnable = true;
        break;

      case 'sneak':
        this.sneakEnable = true;
        if (msgArr[1] !== undefined) {
          this.sneakInterval = parseInt(msgArr[1]);
        }
        break;

      case 'jump':
        this.jumpEnable = true;
        if (msgArr[1] !== undefined) {
          this.jumpInterval = parseInt(msgArr[1]);
        }
        break;

      case 'swing':
        this.swingEnable = true;
        if (msgArr[1] !== undefined) {
          this.swingArmInterval = parseInt(msgArr[1]);
        }
        break;

      case 'fun':
        this.funnyAction();
        break;

      default:
        console.log(`Invalid action: ${cmd}`);
        console.log(`Valid actions: ${this.getAllCmd().join(' | ')}`);
        return false;
      }
      return true;
  }

  private getAllCmd() {
    return ['fun', 'spin', 'sneak', 'jump', 'watchPlayer', 'swing', 'start', 'stop'];
  }

  public stop() {
    this.actionEnable = false;
    this.spinEnable = false;
    this.sneakEnable = false;
    this.jumpEnable = false;
    this.watchPlayerEnable = false;
    
    this.bot?.clearControlStates();
  }

  public tick() {
    if (!this.actionEnable || !this.bot) {
      return;
    }
    this.ticker++;
    
    // 这两个动作不兼容，若同时设置，只有bot附近没有玩家时才开始转圈圈
    if (this.watchPlayerEnable) {
      const nearestPlayer = this.bot?.nearestEntity(entity => 
        entity.type === 'player' && entity.position.distanceTo(this.bot?.entity.position!) < 6);

      if (nearestPlayer) {
        this.watchPlayer(nearestPlayer.position);
      } else if (this.spinEnable) {
        this.spin();
      }
    } else if (this.spinEnable) {
      this.spin();
    }

    this.jumpEnable && this.jumpSometime();
    this.sneakEnable && this.sneakSometime();
    this.swingEnable && this.swingArmSometime();
  }

  /************************* Action **************************/
  private funnyAction() {
    this.stop();
    this.enableAction();
    this.spinEnable = true;
    this.jumpEnable = true;
    this.sneakEnable = true;
    this.swingEnable = true;
    this.watchPlayerEnable = true;
  }

  private spin() {
    this.bot?.look(this.bot.entity.yaw + this.spinDeltaYaw, 0, true);
  }

  private swingArmSometime() {
    if (this.ticker < this.nextSwingArmTick || !this.bot) {
      return;
    }
    this.nextSwingArmTick = this.ticker + this.swingArmInterval;
    const hand = Math.random() > 0.5 ? 'right' : 'left';
    this.bot?.swingArm(hand, true);
  }

  private sneakSometime() {
    if (this.ticker < this.nextSneakTick || !this.bot) {
      return;
    }
    this.nextSneakTick = this.ticker + this.sneakInterval;
    this.bot?.setControlState('sneak', true);

    // TODO: 尽量不用 setTimeout
    setTimeout(() => {
      this.bot?.setControlState('sneak', false);
    }, this.sneakInterval / 2 * 50);
  }

  private jumpSometime() {
    if (this.ticker < this.nextJumpTick || !this.bot) {
      return;
    }
    this.nextJumpTick = this.ticker + this.jumpInterval;
    this.bot.setControlState('jump', true);
    this.bot.setControlState('jump', false);
  }

  private watchPlayer(vec?: Vec3) {
    if (vec) {
      this.bot?.lookAt(vec);
      return;
    }
    
    const nearestPlayer = this.bot?.nearestEntity(entity => entity.type === 'player');
    if (!nearestPlayer) {
      return;
    }
    const pos = nearestPlayer.position;
    this.bot?.lookAt(new Vec3(pos.x, pos.y + 1, pos.z));
  }
}


const botAction = new BotAction();
export default botAction;