import mineflayer from 'mineflayer';
import prismEntity from 'prismarine-entity';
import { pluginReady, waitPluginLoads } from '../utils/pluginWaiter.js';
import { toRadians } from '../utils/MathUtil.js';
import StringUtil from '../utils/StringUtil.js';

const pluginName = 'fishman'

const defaultConfig: FishmanConfig = {
  enableRotation: true,
  rotationIntervalTick: 20 * 20,
  rotationIndex: 0,
  rotationData: [
    {yaw: 0, pitch: 0},
    {yaw: 90, pitch: 0},
  ]
}


function heldFishRod(bot: mineflayer.Bot) {
  if (bot.heldItem?.name === 'fishing_rod') {
    return;
  }
  return bot.equip(bot.registry.itemsByName.fishing_rod!.id, 'hand')
}


function checkIfBobberExist(bot: mineflayer.Bot) {
  return bot._lastBobber !== null &&
    bot.entities[bot._lastBobber!.id] !== undefined;
}

function shouldThrowAgain(bot: mineflayer.Bot) {
  if (!bot._lastBobber) {
    throw new Error('Bobber not found');
  }

  const bobberPos = bot._lastBobber.position;
  const blockUnderBobber = bot.blockAt(bobberPos);
  if (blockUnderBobber?.name === 'water') {
    bot._bobberNotInWaterTick = -1;
  }
  bot._bobberNotInWaterTick++;

  // 长时间未进入水中则重新投掷 （这里是6秒）
  if (bot._bobberNotInWaterTick >= 3) {
    return true;
  }

  // 检查鱼钩是否勾到物品或生物
  if (bot._lastBobber.metadata[8] && Number(bot._lastBobber.metadata[8]) - 1 !== 0) {
    return true;
  }

  return false;
}

async function fishingIntervalCheck(bot: mineflayer.Bot) {
  try {
    await bot.heldFishRod();
  } catch (err) {
    bot.baseError(pluginName, String(err))
    bot.stopFishing();
  }

  // 检查鱼钩是否存在
  if (!checkIfBobberExist(bot)) {
    if (bot.usingHeldItem) {
      bot.activateItem();
    }
    bot.activateItem();
    return;
  }

  // 检查是否需要重新抛钩
  if (shouldThrowAgain(bot)) {
    bot._lastBobber = null;
    bot.activateItem();
    throwFishingRodAgain(bot);
  }
}


function registCmd(bot: mineflayer.Bot) {
  const CommandManager = bot.getCommandManager();
  bot.registerCmd(CommandManager.command('fish')
    .then(CommandManager.command('activate')
      .execute(async bot => {
        await bot.heldFishRod();
        bot.activateItem();
      }))
    .then(CommandManager.command('on').execute(bot => bot.startFishing()))
    .then(CommandManager.command('off').execute(bot => bot.stopFishing()))
    .then(CommandManager.command('bobber')
      .execute(bot => bot.withoutLogTitle().baseInfo(pluginName, JSON.stringify(bot._lastBobber))))
    .then(CommandManager.command('rotation')
      .then(CommandManager.command('on').execute(bot => bot.setConfig(pluginName, 'enableRotation', true)))
      .then(CommandManager.command('off').execute(bot => bot.setConfig(pluginName, 'enableRotation', false)))
      .then(CommandManager.command('add')
        .then(CommandManager.value('<yaw,pitch>')
          .execute((bot, value) => {
            const yawPitch = StringUtil.stringToList(value);
            if (yawPitch.length !== 2) {
              throw new Error('Invalid yaw pitch format');
            }
            bot.setConfig(pluginName, 'rotationData', 
              [...bot.getConfig(pluginName, 'rotationData'), {yaw: Number(yawPitch[0]), pitch: Number(yawPitch[1])}]);
          })))
      .then(CommandManager.command('clear').execute(bot => bot.setConfig(pluginName, 'rotationData', [])))
      .then(CommandManager.command(['interval', 'i'])
        .then(CommandManager.value('<tick>')
          .execute((bot, value) => {
            const interval = Number(value);
            bot.updateTimeTask('rotationBot', interval);
            bot.setConfig(pluginName, 'rotationIntervalTick', interval);
          }))
      )
    )
    .then(CommandManager.command('config')
      .then(CommandManager.command('reload')
        .execute(bot => bot.loadConfig(pluginName, defaultConfig)))
      .then(CommandManager.command('reset')
        .execute(bot => bot.saveConfig(pluginName, defaultConfig)))
      .then(CommandManager.command('show')
        .execute(bot => bot.withoutLogTitle().baseInfo(pluginName, JSON.stringify(bot.configMap[pluginName]))))
    )
  );
}

function checkIfFishSuccess(bot: mineflayer.Bot) {
  if (!checkIfBobberExist(bot)) {
    return;
  }
  // See https://minecraft.wiki/w/Java_Edition_protocol/Entity_metadata#Fishing_Bobber
  if (bot._lastBobber?.metadata?.[9]) {
    bot.activateItem();
    
    throwFishingRodAgain(bot);
  }
}

function throwFishingRodAgain(bot: mineflayer.Bot) {
  if (bot.heldItem?.name !== 'fishing_rod') {
    throw new Error('Not holding fishing rod');
  }

  if (!bot.hasTimeTask('throwFishingRodAgain')) {
      bot.createOnceTimeTask('throwFishingRodAgain', 5, () => {
        if (!bot.usingHeldItem || !checkIfBobberExist(bot)) {
          bot.activateItem();
        }
      })
    }
}

// 防止被检测为脚本
function rotationBot(bot: mineflayer.Bot) {
  if (!bot.getConfig(pluginName, 'enableRotation')) {
    return;
  }
  let rotationIndex = bot.getConfig(pluginName, 'rotationIndex') as FishmanConfig['rotationIndex'];
  const rotationData = bot.getConfig(pluginName, 'rotationData') as FishmanConfig['rotationData'];

  if (rotationData.length === 0) {
    return;
  }
  if (rotationIndex >= rotationData.length) {
    rotationIndex = 0;
  }
  bot.look2(
    rotationData[rotationIndex]!.yaw, 
    rotationData[rotationIndex]!.pitch, 
    true
  );
  bot.setConfig(pluginName, 'rotationIndex', rotationIndex + 1, false);
}


export default async function inject(bot: mineflayer.Bot)  {
    await waitPluginLoads(bot, ['logger', 'task', 'command', 'makeConfig']);
    bot.loadConfig(pluginName, defaultConfig);

    bot._isFishing = false;
    bot._lastBobber = null;
    bot._bobberNotInWaterTick = -1;
    bot.heldFishRod = () => heldFishRod(bot);

    bot.startFishing = async () => {
      if (bot._isFishing) return;
      try {
        await heldFishRod(bot);
      } catch (err) {
        bot.baseError(pluginName, String(err));
        bot.stopFishing();
        return;
      }

      bot.activateItem();
      if (!bot.usingHeldItem) {
      }
      bot.setConfig(pluginName, 'rotationIndex', 0, false);
      bot._bobberNotInWaterTick = -1;
      bot.removeListener('entitySpawn', onBobberSpawn);
      bot._client.removeListener('entity_destroy', onBobberDestory);
      bot.on('entitySpawn', onBobberSpawn);
      bot._client.on('entity_destroy', onBobberDestory);

      bot.removeTimeTask('fishingIntervalCheck');
      bot.removeTimeTask('checkIfFished');
      bot.removeTimeTask('rotationBot');
      bot.createTimeTask('fishingIntervalCheck', 40, fishingIntervalCheck);
      bot.createTimeTask('checkIfFished', 2, checkIfFishSuccess);
      bot.createTimeTask('rotationBot', bot.getConfig(pluginName, 'rotationIntervalTick'), rotationBot, true);
      bot._isFishing = true;
    }

    bot.stopFishing = () => {
      bot.removeTimeTask('rotationBot');
      bot.removeTimeTask('fishingIntervalCheck');
      bot.removeTimeTask('checkIfFished');
      bot.removeTimeTask('throwFishingRodAgain');
      bot.removeListener('entitySpawn', onBobberSpawn);
      bot._client.removeListener('entity_destroy', onBobberDestory);
      bot._isFishing = false;

      if (bot.heldItem?.name === 'fishing_rod' &&
          checkIfBobberExist(bot)
      ) {
        bot.activateItem();
      }
      bot._lastBobber = null;
    }

    const bobberId = bot.supportFeature('fishingBobberCorrectlyNamed') ? 
      bot.registry.entitiesByName.fishing_bobber!.id : 90;


    function onBobberSpawn(entity: prismEntity.Entity) {
      if (entity.entityType === bobberId && !bot._lastBobber) {
        bot._lastBobber = entity;
      }
    }

    function onBobberDestory(packet: any) {
      if (!bot._lastBobber) return;
      if (packet.entityIds.some((id: number) => id === bot._lastBobber!.id)) {
        bot._lastBobber = null;
        bot.activateItem();
      }
    }

    registCmd(bot);
    pluginReady(bot, pluginName);
}

declare module 'mineflayer' {
  interface Bot {
    _isFishing: boolean,
    _lastBobber: prismEntity.Entity | null,
    _bobberNotInWaterTick: number,
    heldFishRod(): Promise<void> | void,
    startFishing(): Promise<void>,
    stopFishing(): void,
  }
}

interface FishmanConfig {
  enableRotation: boolean,
  rotationIntervalTick: number,
  rotationIndex: number,
  rotationData: {yaw: number, pitch: number}[]
}