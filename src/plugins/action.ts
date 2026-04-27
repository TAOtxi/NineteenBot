import mineflayer from 'mineflayer';
import { Vec3 } from 'vec3';



interface ActionVar {
  enabled: boolean;

  watchPlayer: boolean;

  spin: boolean;
  spinAngle: number;

  jump: boolean;
  nextJumpTick: number;
  jumpInterval: number;

  sneak: boolean;
  nextSneakTick: number;
  sneakInterval: number;

  swing: boolean;
  nextSwingTick: number;
  swingArmInterval: number;

  specitalActionType: string;
}

function showHelp() {
  
}

function regesterCmd(bot: mineflayer.Bot) {
  const CommandManager = bot.getCommandManager();
  bot.registerCmd(CommandManager.command(['act', 'action'])
    .then(CommandManager.command('start').execute(() => bot._action.stop()))
    .then(CommandManager.command('info'))
    .then(CommandManager.command('stop')
      .then(CommandManager.command(['jump', 'sneak', 'look', 'swing'])))
    .then(CommandManager.command('spin')
      .then(CommandManager.argument(['-a', '--angle'])))
    .then(CommandManager.command('jump')
      .then(CommandManager.argument(['-i', '--interval'])))
    .then(CommandManager.command('sneak')
      .then(CommandManager.argument(['-i', '--interval'])))
    .then(CommandManager.command('swing')
      .then(CommandManager.argument(['-i', '--interval'])))
    .then(CommandManager.command('fun')))
}


/************************* Action **************************/
class BotAction {
  private actionVar: ActionVar = {
    enabled: false,
    watchPlayer: false,
    spin: false,
    spinAngle: Math.PI / 5,
    jump: false,
    nextJumpTick: 0,
    jumpInterval: 3,
    sneak: false,
    nextSneakTick: 0,
    sneakInterval: 7,
    swing: false,
    nextSwingTick: 0,
    swingArmInterval: 7,
    specitalActionType: '',
  };

  private _bot: mineflayer.Bot;

  constructor(bot: mineflayer.Bot) {
    this._bot = bot;
  }

  public isEnabled() {
    return this.actionVar.enabled;
  }

  public setEnabled(enabled: boolean) {
    this.actionVar.enabled = enabled;
  }

  public startFunnyAction() {
    this.stop();
    this.actionVar.specitalActionType = 'fun';
    this.actionVar.enabled = true;
  }

  public stop() {
    this.actionVar.enabled = false;
    this.actionVar.spin = false;
    this.actionVar.sneak = false;
    this.actionVar.jump = false;
    this.actionVar.swing = false;
    this.actionVar.watchPlayer = false;
    this.actionVar.specitalActionType = '';
    
    this._bot.clearControlStates();
  }

  private spin() {
    this._bot.look(this._bot.entity.yaw + this.actionVar.spinAngle, 0, true);
  }

  private swingArmSometime() {
    if (this._bot.ticker < this.actionVar.nextSwingTick) {
      return;
    }
    this.actionVar.nextSwingTick = this._bot.ticker + this.actionVar.swingArmInterval;
    const hand = Math.random() > 0.5 ? 'right' : 'left';
    this._bot.swingArm(hand, true);
  }

  private sneakSometime() {
    if (this._bot.ticker < this.actionVar.nextSneakTick) {
      return;
    }
    this.actionVar.nextSneakTick = this._bot.ticker + this.actionVar.sneakInterval;
    this._bot.setControlState('sneak', true);

    // TODO: 尽量不用 setTimeout
    // 果然出问题了，bot断联后，这个setTimeout还在继续允许，导致报错
    setTimeout(() => {
      this._bot?.setControlState('sneak', false);
    }, this.actionVar.sneakInterval / 2 * 50);
  }

  private jumpSometime() {
    if (this._bot.ticker < this.actionVar.nextJumpTick) {
      return;
    }
    this.actionVar.nextJumpTick = this._bot.ticker + this.actionVar.jumpInterval;
    this._bot.setControlState('jump', true);
    this._bot.setControlState('jump', false);
  }

  // TODO: 待优化
  private watchPlayer(vec?: Vec3) {
    if (vec) {
      this._bot.lookAt(vec);
      return;
    }
    
    const nearestPlayer = this._bot.nearestEntity(entity => entity.type === 'player');
    if (!nearestPlayer) {
      return;
    }
    const pos = nearestPlayer.position;
    this._bot.lookAt(new Vec3(pos.x, pos.y + 1, pos.z));
  }

  private funnyAction() {
    this.jumpSometime();
    this.sneakSometime();
    this.swingArmSometime();

    const nearestPlayer = this._bot.nearestEntity(entity => 
        entity.type === 'player' && entity.position.distanceTo(this._bot.entity.position!) < 6);
    if (nearestPlayer) {
      const pos = new Vec3(nearestPlayer.position.x, nearestPlayer.position.y + 1.62, nearestPlayer.position.z);
      this.watchPlayer(pos);
    } else {
      this.spin();
    }
  }
}


export default function inject(bot: mineflayer.Bot) {
  bot._action = new BotAction(bot);

  bot.on('physicsTick', () => {
    if (!bot._action.isEnabled()) {
      return;
    }
  })

}


declare module 'mineflayer' {
  interface Bot {
    _action: BotAction;

  }
}
