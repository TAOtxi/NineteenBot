import mineflayer from 'mineflayer';
import { Vec3 } from 'vec3';
import Logger from '../utils/Logger.js';

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

  public setBot(bot: mineflayer.Bot, logToFile: boolean) {
    this.bot = bot;
    logger.setLogToFile(logToFile);
  }

  public enableAction() {
    this.actionEnable = true;
  }

  public disableAction() {
    this.actionEnable = false;
  }

  public getActionStatus() {
    logger.info('============ Action Status ============');
    logger.info(`Action enabled:        ${this.actionEnable}`);
    logger.info(`Spin enabled:          ${this.spinEnable}`);
    logger.info(`Jump enabled:          ${this.jumpEnable}`);
    logger.info(`Sneak enabled:         ${this.sneakEnable}`);
    logger.info(`Swing enabled:         ${this.swingEnable}`);
    logger.info(`Watch player enabled:  ${this.watchPlayerEnable}`);
    logger.info(`Special action type:   ${this.specitalActionType}`);
    logger.info('=======================================');
  }

  // return true if run successfully.
  public handleCmd(msg: string) {
    /********* Cmd  *********/
    if (msg === 'info') {
      this.getActionStatus();
      return true;
    }

    if (msg === 'start') {
      this.enableAction();
      return true;
    }

    if (msg === 'stop') {
      this.stop();
      return true;
    }

    if (!this.actionEnable) {
      logger.error('Action is disabled. Please enable it first.');
      return false;
    }

    const msgArr = msg.split(' ').filter((item) => item !== '');
    const cmd = msgArr[0];

    /************ Action Cmd ************/
    if (cmd === 'spin') {
      this.spinEnable = true;
      if (msgArr[1] !== undefined) {
        this.spinDeltaYaw = parseFloat(msgArr[1]) / 180 * Math.PI;
      }
    }

    else if (cmd === 'look') {  // Always look at the nearest player.
      this.watchPlayerEnable = true;
    }

    else if (cmd === 'jump') {
      this.jumpEnable = true;
      if (msgArr[1] !== undefined) {
        this.jumpInterval = parseInt(msgArr[1]);
      }
    }

    else if (cmd === 'sneak') {
      this.sneakEnable = true;
      if (msgArr[1] !== undefined) {
        this.sneakInterval = parseInt(msgArr[1]);
      }
    }

    else if (cmd === 'swing') {
      this.swingEnable = true;
      if (msgArr[1] !== undefined) {
        this.swingArmInterval = parseInt(msgArr[1]);
      }
    }

    else if (cmd === 'fun') {
      this.specitalActionType = 'funnyAction';
    }

    else {
      cmd && logger.error(`Invalid action: ${cmd}`);
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

    if (this.specitalActionType === 'funnyAction') {
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
    this.specitalActionType = 'funnyAction';
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