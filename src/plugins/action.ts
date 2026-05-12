import mineflayer, { type Player } from 'mineflayer';
import prismEntity from 'prismarine-entity';
import { Vec3 } from 'vec3';
import { pluginReady, waitPluginLoads } from '../utils/pluginWaiter.js';
import StringUtil from '../utils/StringUtil.js';
import { fromNotchianYaw, fromNotchianPitch, toDegrees, toRadians } from '../utils/MathUtil.js';

const pluginName = 'action';

function showHelp() {

}

function regesterCmd(bot: mineflayer.Bot) {
  const CommandManager = bot.getCommandManager();
  bot.registerCmd(CommandManager.command(['act', 'action']).execute(showHelp)
    .then(CommandManager.command('help').execute(showHelp))
    .then(CommandManager.command('info'))
    .then(CommandManager.command('stop').execute(bot => stopAction(bot))
      .then(CommandManager.value('<StopType>').execute(stopAction)))
    .then(CommandManager.command('spin')
      .execute((bot, args) => startSpin(bot, args?.['-a'] ? Number(args['-a']) : undefined))
      .then(CommandManager.argument(['-a', '--angle'])))
    .then(CommandManager.command('jump')
      .execute((bot, args) => startJump(bot, args?.['-i'] ? Number(args['-i']) : undefined))
      .then(CommandManager.argument(['-i', '--interval'])))
    .then(CommandManager.command('sneak')
      .execute((bot, args) => startSneak(bot, args?.['-i'] ? Number(args['-i']) : undefined))
      .then(CommandManager.argument(['-i', '--interval'])))
    .then(CommandManager.command('swing')
      .execute((bot, args) => startSwing(bot, args?.['-i'] ? Number(args['-i']) : undefined))
      .then(CommandManager.argument(['-i', '--interval'])))
    .then(CommandManager.command('track').execute(startTrackPlayer))
    .then(CommandManager.command('spec')
      .then(CommandManager.value('<ActionType>').execute(startSpecitalAction)))
    .then(CommandManager.command('look')
      .then(CommandManager.argument(['-d', '--direction']).execute(setDirection))
      .then(CommandManager.argument(['-r', '--rotation']).execute(setRotation))
      .then(CommandManager.argument(['-b', '--block']).execute(setLookPosition))
      .then(CommandManager.argument(['-p', '--player']).execute(setLookPlayer)))
  );
}

function setDirection(bot: mineflayer.Bot, direction: string) {
  let yaw = 0;
  let pitch = 0;
  if (direction === 'up') {
    pitch = -Math.PI / 2;
  } else if (direction === 'down') {
    pitch = Math.PI / 2;
  } else if (direction === 'east') {
    yaw = -Math.PI / 2;
  } else if (direction === 'west') {
    yaw = Math.PI / 2;
  } else if (direction === 'north') {
    yaw = -Math.PI;
  } else if (direction === 'south') {
    // yaw = 0;
  } else {
    bot.baseError(pluginName, `Invalid direction ${direction}`);
    return;
  }
  bot.baseInfo(pluginName, `Look at ${direction} (${toDegrees(yaw)}, ${toDegrees(pitch)})`);
  bot.look2(yaw, pitch, true);
}

function setLookPosition(bot: mineflayer.Bot, position: string) {
  const pos = StringUtil.stringToList(position, ',', parseFloat);
  if (pos.length !== 3) {
    bot.baseError(pluginName, `Invalid position ${position}`);
    return;
  }
  bot.baseInfo(pluginName, `Look at ${position}`);
  bot.lookAt(new Vec3(pos[0], pos[1], pos[2]), true);
}

function setRotation(bot: mineflayer.Bot, rotation: string) {
  const pos = StringUtil.stringToList(rotation, ',', parseFloat);
  if (pos.length !== 2) {
    bot.baseError(pluginName, `Invalid rotation ${rotation}`);
    return;
  }
  bot.baseInfo(pluginName, `Look at (${pos[0]}, ${pos[1]})`);
  bot.look2(pos[0], pos[1], true);
}

function setLookPlayer(bot: mineflayer.Bot, player: string) {
  const target = bot.players[player];
  if (target === undefined) {
    bot.baseError(pluginName, `Player ${player} not found`);
    return;
  }
  bot.baseInfo(pluginName, `Look at player ${player}`);
  bot.lookAt(target.entity.position, true);
}


/************************* Action **************************/
const defaultActionVar = {
  enabled: false,
  trackPlayer: false,
  spin: false,
  spinAngle: Math.PI / 5,
  jump: false,
  jumpInterval: 3,
  sneak: false,
  sneakInterval: 7,
  swing: false,
  swingArmInterval: 7,

  specitalActionType: '',
  funLookPlayerMinDistance: 6,
}

function tick(bot: mineflayer.Bot) {
  if (bot._actionVar.jump) {
    bot.tickTask('jump');
  }
  if (bot._actionVar.sneak) {
    bot.tickTask('sneak');
  }
  if (bot._actionVar.swing) {
    bot.tickTask('swing');
  }
  if (bot._actionVar.trackPlayer) {
    watchNearestPlayer(bot);
  }
  if (bot._actionVar.spin) {
    spinAction(bot, bot._actionVar.spinAngle);
  }
  if (bot._actionVar.specitalActionType === 'fun') {
    funnyAction(bot);
  }
}

function startTrackPlayer(bot: mineflayer.Bot) {
  bot._actionVar.enabled = true;
  bot._actionVar.trackPlayer = true;
  bot.baseInfo(pluginName, 'Track player enabled.');
}

function startSneak(bot: mineflayer.Bot, sneakInterval?: number) {
  bot._actionVar.enabled = true;
  bot._actionVar.sneak = true;
  bot._actionVar.sneakInterval = sneakInterval || bot._actionVar.sneakInterval;
  bot.baseInfo(pluginName, 'Sneak enabled.');
}

function startJump(bot: mineflayer.Bot, jumpInterval?: number) {
  bot._actionVar.enabled = true;
  bot._actionVar.jump = true;
  bot._actionVar.jumpInterval = jumpInterval || bot._actionVar.jumpInterval;
  bot.baseInfo(pluginName, 'Jump enabled.');
}

function startSpin(bot: mineflayer.Bot, spinAngle?: number) {
  bot._actionVar.enabled = true;
  bot._actionVar.spin = true;
  if (spinAngle !== undefined) {
    bot._actionVar.spinAngle = toRadians(spinAngle);
  }
  bot.baseInfo(pluginName, 'Spin enabled.');
}

function startSwing(bot: mineflayer.Bot, swingArmInterval?: number) {
  bot._actionVar.enabled = true;
  bot._actionVar.swing = true;
  bot._actionVar.swingArmInterval = swingArmInterval || bot._actionVar.swingArmInterval;
  bot.baseInfo(pluginName, 'Arm swing enabled.');
}

function startSpecitalAction(bot: mineflayer.Bot, type: string) {
  switch(type) {
    case 'fun':
      startFunnyAction(bot);
      bot.baseInfo(pluginName, 'Funny action enabled.');
      break;
    default:
      bot.baseError(pluginName, `Type ${type} not found.`);
      return;
  }
  bot._actionVar.specitalActionType = type;
}

function startFunnyAction(bot: mineflayer.Bot) {
  stopAction(bot);
  bot._actionVar.swing = true;
  bot._actionVar.sneak = true;
  bot._actionVar.jump = true;
  bot._actionVar.specitalActionType = 'fun';
  bot._actionVar.enabled = true;
}

function stopAction(bot: mineflayer.Bot, stopType?: string) {
  if (stopType !== undefined) {
    if (stopType === 'spin') {
      bot._actionVar.spin = false;
    } else if (stopType === 'jump') {
      bot._actionVar.jump = false;
    } else if (stopType === 'sneak') {
      bot._actionVar.sneak = false;
      if (bot.hasTimeTask('sneakUp')) {
        bot.setControlState('sneak', false);
        bot.removeTimeTask('sneakUp');
      }
    } else if (stopType === 'swing') {
      bot._actionVar.swing = false;
    } else if (stopType === 'track') {
      bot._actionVar.trackPlayer = false;
    } else if (stopType === 'spec') {
      bot._actionVar.specitalActionType = '';
    } else {
      bot.baseError(pluginName, `Type ${stopType} not found`);
    }
    return;
  }

  bot._actionVar.enabled = false;
  bot._actionVar.spin = false;
  bot._actionVar.sneak = false;
  bot._actionVar.jump = false;
  bot._actionVar.swing = false;
  bot._actionVar.trackPlayer = false;
  bot._actionVar.specitalActionType = '';
  bot.removeTimeTask('sneakUp');

  bot.clearControlStates();
}

function spinAction(bot: mineflayer.Bot, spinAngle: number) {
  bot.look(bot.entity.yaw + toRadians(spinAngle), 0, true);
}

function swingArmAction(bot: mineflayer.Bot) {
  const hand = Math.random() > 0.5 ? 'right' : 'left';
  bot.swingArm(hand, true);
}

function sneakAction(bot: mineflayer.Bot) {
  bot.setControlState('sneak', true);

  bot.createOnceTimeTask('sneakUp', bot._actionVar.sneakInterval / 2, bot => {
    bot.setControlState('sneak', false);
  })
}

function jumpAction(bot: mineflayer.Bot) {
  bot.setControlState('jump', true);
  bot.setControlState('jump', false);
}

function watchEntity(bot: mineflayer.Bot, entity: prismEntity.Entity) {
  bot.lookAt(entity.position.offset(0, entity.height, 0), true);
}

// TODO: 筛选npc玩家
function findNearestPlayer(bot: mineflayer.Bot) {
  let target: Player | null = null;
  let minDistance = Number.MAX_VALUE;
  for (const username in bot.players) {
    if (username === bot.username) continue;
    if (!bot.players[username]!.entity) continue;
    const player = bot.players[username] as Player;
    const distance = player.entity.position.distanceSquared(bot.entity.position!);
    if (distance < minDistance) {
      minDistance = distance;
      target = player;
    }
  }
  return target?.entity;
}

function watchNearestPlayer(bot: mineflayer.Bot, vec?: Vec3) {
  if (vec) {
    bot.lookAt(vec, true);
    return;
  }

  const nearestPlayer = findNearestPlayer(bot);
  nearestPlayer && watchEntity(bot, nearestPlayer);
}

function funnyAction(bot: mineflayer.Bot) {
  const target = findNearestPlayer(bot);

  if (target) {
    watchEntity(bot, target);
  } else {
    spinAction(bot, bot._actionVar.spinAngle);
  }
}

function initTask(bot: mineflayer.Bot) {
  bot.createTickTask('jump', bot._actionVar.jumpInterval, jumpAction);
  bot.createTickTask('sneak', bot._actionVar.sneakInterval, sneakAction);
  bot.createTickTask('swing', bot._actionVar.swingArmInterval, swingArmAction);
}


export default async function inject(bot: mineflayer.Bot) {
  await waitPluginLoads(bot, ['task', 'command']);
  bot._actionVar = { ...defaultActionVar };
  bot.setDirection = (direction: string) => setDirection(bot, direction);
  initTask(bot);
  bot.on('physicsTick', () => {
    if (bot._actionVar.enabled) {
      tick(bot);
    }
  });
  // bot.look2 = (yaw: number, pitch: number, force?: boolean) => bot.look(fromNotchianYaw(yaw), fromNotchianPitch(pitch), force);

  regesterCmd(bot);
  pluginReady(bot, pluginName);
}


declare module 'mineflayer' {
  interface Bot {
    _actionVar: typeof defaultActionVar;
    setDirection: (direction: string) => void;
    // look2: (yaw: number, pitch: number, force?: boolean) => void;
  }
}
