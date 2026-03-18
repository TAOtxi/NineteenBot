import mineflayer from 'mineflayer';
import { Vec3 } from 'vec3';
import Logger from '../utils/Logger.js';
import type CmdParser from '../utils/ArgsUtil.js';

const logger = Logger.getLogger('BotAction');

class BotAction {
  private ticker = 0;
  private actionEnable = true;
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

  private specitalActionType = '';

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

  private showHelp() {
    logger.withoutPrefix().info('================== Action Info Help ==================');
    logger.withoutPrefix().info('start:                开启');
    logger.withoutPrefix().info('stop:                 关闭');
    logger.withoutPrefix().info('spin -a <angle>:      开启转圈圈模式，旋转<angle>°/tick');
    logger.withoutPrefix().info('jump -i <interval>:   时不时跳跃，间隔<interval>tick');
    logger.withoutPrefix().info('sneak -i <interval>:  时不时潜行，间隔<interval>tick');
    logger.withoutPrefix().info('swing -i <interval>:  时不时手臂摆动，间隔<interval>tick');
    logger.withoutPrefix().info('look:                 视角锁定玩家');
    logger.withoutPrefix().info('spc:                  开启组合动作');
    logger.withoutPrefix().info('======================================================');
  }

  public getActionStatus() {
    logger.withoutPrefix().info('============== Action Status ==============');
    logger.withoutPrefix().info(`Action enabled:        ${this.actionEnable}`);
    logger.withoutPrefix().info(`Spin enabled:          ${this.spinEnable} (${this.spinDeltaYaw * 180 / Math.PI}°)`);
    logger.withoutPrefix().info(`Jump enabled:          ${this.jumpEnable} (${this.jumpInterval}/tick)`);
    logger.withoutPrefix().info(`Sneak enabled:         ${this.sneakEnable} (${this.sneakInterval}/tick)`);
    logger.withoutPrefix().info(`Swing enabled:         ${this.swingEnable} (${this.swingArmInterval}/tick)`);
    logger.withoutPrefix().info(`Watch player enabled:  ${this.watchPlayerEnable}`);
    logger.withoutPrefix().info(`Special action type:   ${this.specitalActionType === '' ? '<empty>' : this.specitalActionType}`);
    logger.withoutPrefix().info('===========================================');
  }

  // return true if run successfully.
  public handleCmd(parseCmd: CmdParser) {
    if (parseCmd.isCmd(['help', '?']) || !parseCmd.getFirstCmd()) {
      this.showHelp();
      return true;
    }

    /********* Cmd  *********/
    if (parseCmd.isCmd('info')) {
      this.getActionStatus();
      return true;
    }

    if (parseCmd.isCmd('start')) {
      this.enableAction();
      return true;
    }

    if (parseCmd.isCmd('stop')) {
      parseCmd.dive();
      if (parseCmd.getCmds().length === 0) {
        this.stop();
        return true;
      }
      if (parseCmd.isCmd('spin')) {
        this.spinEnable = false;
      } else if (parseCmd.isCmd('jump')) {
        this.jumpEnable = false;
      } else if (parseCmd.isCmd('sneak')) {
        this.sneakEnable = false;
      } else if (parseCmd.isCmd('swing')) {
        this.swingEnable = false;
      } else if (parseCmd.isCmd('look')) {
        this.watchPlayerEnable = false;
      } else if (parseCmd.isCmd('spc')) {
        this.specitalActionType = '';
      } else {
        logger.error(`Invalid stop action: ${parseCmd.getFirstCmd()}`);
        logger.error(`All valid stop actions: ${this.getAllCmd().join(' | ')} | spc`);
        return false;
      }
      return true;
    }

    if (!this.actionEnable) {
      logger.error('Action is disabled. Please enable it first.');
      return false;
    }

    /************ Action Cmd ************/
    if (parseCmd.isCmd('spin')) {
      this.spinEnable = true;
      const angle = parseCmd.getValue(['-a', '--angle']);
      if (angle !== undefined) {
        this.spinDeltaYaw = parseFloat(angle) / 180 * Math.PI;
      }
    }

    else if (parseCmd.isCmd('look')) {  // Always look at the nearest player.
      this.watchPlayerEnable = true;
    }

    else if (parseCmd.isCmd('jump')) {
      this.jumpEnable = true;
      const interval = parseCmd.getValue(['-i', '--interval']);
      if (interval !== undefined) {
        this.jumpInterval = parseInt(interval);
      }
    }

    else if (parseCmd.isCmd('sneak')) {
      this.sneakEnable = true;
      const interval = parseCmd.getValue(['-i', '--interval']);
      if (interval !== undefined) {
        this.sneakInterval = parseInt(interval);
      }
    }

    else if (parseCmd.isCmd('swing')) {
      this.swingEnable = true;
      const interval = parseCmd.getValue(['-i', '--interval']);
      if (interval !== undefined) {
        this.swingArmInterval = parseInt(interval);
      }
    }

    else if (parseCmd.isCmd('fun')) {
      this.startFunnyAction();
    }

    else {
      logger.error(`Invalid action: ${parseCmd.getFirstCmd()}`);
      logger.error(`All valid actions: ${this.getAllCmd().join(' | ')}`);
      return false;
    }
    
    return true;
  }

  private getAllCmd() {
    return ['fun', 'spin', 'sneak', 'jump', 'look', 'swing', 'start', 'stop'].sort();
  }

  public stop() {
    this.actionEnable = false;
    this.spinEnable = false;
    this.sneakEnable = false;
    this.jumpEnable = false;
    this.swingEnable = false;
    this.watchPlayerEnable = false;
    this.specitalActionType = '';
    
    this.bot?.clearControlStates();
  }

  public tick() {
    if (!this.actionEnable || !this.bot) {
      return;
    }
    this.ticker++;

    if (this.specitalActionType === 'fun') {
      this.funnyAction();
      return;
    }

    this.watchPlayerEnable && this.watchPlayer();
    this.spinEnable && this.spin();
    this.jumpEnable && this.jumpSometime();
    this.sneakEnable && this.sneakSometime();
    this.swingEnable && this.swingArmSometime();
  }

  public startFunnyAction() {
    this.stop();
    this.specitalActionType = 'fun';
    this.enableAction();
  }
  
  /************************* Action **************************/
  private funnyAction() {
    this.jumpSometime();
    this.sneakSometime();
    this.swingArmSometime();

    const nearestPlayer = this.bot?.nearestEntity(entity => 
        entity.type === 'player' && entity.position.distanceTo(this.bot?.entity.position!) < 6);
    if (nearestPlayer) {
      const pos = new Vec3(nearestPlayer.position.x, nearestPlayer.position.y + 1.62, nearestPlayer.position.z);
      this.watchPlayer(pos);
    } else {
      this.spin();
    }
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
    // 果然出问题了，bot断联后，这个setTimeout还在继续允许，导致报错
    setTimeout(() => {
      this.bot?.setControlState?.('sneak', false);
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

  // TODO: 待优化
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