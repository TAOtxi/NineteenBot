import mineflayer from 'mineflayer';



interface ActionVar {
  enable: boolean;

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


