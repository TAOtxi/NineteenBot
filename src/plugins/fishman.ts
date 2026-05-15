import mineflayer from 'mineflayer';
import prismEntity from 'prismarine-entity';
import { pluginReady, waitPluginLoads } from '../utils/pluginWaiter.js';
import StringUtil from '../utils/StringUtil.js';

const pluginName = 'fishman'

const defaultConfig: FishmanConfig = {
  enableRotation: true,
  fishingRodProtect: true,
  rotationIntervalTick: 20 * 20,
  rotationData: [
    {yaw: 0, pitch: 30},
    {yaw: -90, pitch: 30},
  ]
}


function heldFishRod(bot: mineflayer.Bot) {
  if (bot.heldItem?.name === 'fishing_rod') {
    return;
  }
  return bot.equip(bot.registry.itemsByName.fishing_rod!.id, 'hand')
}


function isBobberExist(bot: mineflayer.Bot) {
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
    bot._bobberNotInWaterTick = 0;
  }
  bot._bobberNotInWaterTick++;

  // 长时间未进入水中则重新投掷 （这里是4秒）
  if (bot._bobberNotInWaterTick >= 2) {
    bot._bobberNotInWaterTick = 0;
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
  if (!isBobberExist(bot)) {
    bot.activateItem();
    throwFishingRodAgain(bot);
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
        .execute(bot => {
          bot.loadConfig(pluginName, defaultConfig);
          if (bot.hasTimeTask('rotationBot')) {
            bot.updateTimeTask('rotationBot', bot.getConfig(pluginName, 'rotationIntervalTick'));
          }
        }))
      .then(CommandManager.command('reset')
        .execute(bot => bot.saveConfig(pluginName, defaultConfig)))
      .then(CommandManager.command('show')
        .execute(bot => bot.withoutLogTitle().baseInfo(pluginName, JSON.stringify(bot.configMap[pluginName]))))
    )
  );
}

function isBobberRetrieved(bobber: prismEntity.Entity) {
  // See https://minecraft.wiki/w/Java_Edition_protocol/Entity_metadata#Fishing_Bobber
  return bobber.metadata?.[9]
}

function checkFishingRodIsSafe(bot: mineflayer.Bot) {
  if (!bot.heldItem || bot.heldItem.name !== 'fishing_rod') {
    return false;
  }

  return bot.heldItem.maxDurability - bot.heldItem.durabilityUsed >= 5;
}

function throwFishingRodAgain(bot: mineflayer.Bot) {
  if (bot.heldItem?.name !== 'fishing_rod') {
    bot.baseError(pluginName, 'Not holding fishing rod.');
    bot.stopFishing();
    return;
  }

  if (bot.getConfig(pluginName, 'fishingRodProtect') && 
      !checkFishingRodIsSafe(bot)
  ) {
    bot.baseError(pluginName, 'Fishing rod is almost broken.');
    bot.stopFishing();
    return;
  }

  if (!bot.hasTimeTask('throwFishingRodAgain')) {
      bot.createOnceTimeTask('throwFishingRodAgain', 5, () => {
        if (!bot.usingHeldItem || !isBobberExist(bot)) {
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
  const rotationData = bot.getConfig(pluginName, 'rotationData') as FishmanConfig['rotationData'];

  if (rotationData.length === 0) {
    return;
  }
  if (bot._rotationIndex >= rotationData.length) {
    bot._rotationIndex = 0;
  }
  bot.look2(
    rotationData[bot._rotationIndex]!.yaw, 
    rotationData[bot._rotationIndex]!.pitch, 
    true
  );
  bot._rotationIndex++;
}

export default async function inject(bot: mineflayer.Bot)  {
    await waitPluginLoads(bot, ['logger', 'task', 'command', 'makeConfig']);
    bot.loadConfig(pluginName, defaultConfig);

    bot._isFishing = false;
    bot._lastBobber = null;
    bot._bobberNotInWaterTick = 0;
    bot._rotationIndex = 0;
    bot.heldFishRod = () => heldFishRod(bot);
    bot.isBobberExist = () => isBobberExist(bot);

    bot.startFishing = async () => {
      if (bot._isFishing) return;
      bot.baseInfo(pluginName, 'startFishing');
      try {
        await heldFishRod(bot);
      } catch (err) {
        bot.baseError(pluginName, String(err));
        return;
      }

      if (!bot.heldItem) {
        bot.baseError(pluginName, 'Hand is empty');
        return;
      }

      if (bot.getConfig(pluginName, 'fishingRodProtect') &&
          !checkFishingRodIsSafe(bot)
      ) {
        bot.baseError(pluginName, 'Fishing rod is almost broken or not holding.');
        return;
      }

      bot.activateItem();
      
      bot._rotationIndex = 0;
      bot._bobberNotInWaterTick = -1;
      bot.removeListener('entitySpawn', onBobberSpawn);
      bot._client.removeListener('entity_destroy', onBobberDestory);
      bot.on('entitySpawn', onBobberSpawn);
      bot.on('soundEffectHeard', onCatchFish);
      bot._client.on('entity_destroy', onBobberDestory);

      bot.removeTimeTask('fishingIntervalCheck');
      bot.removeTimeTask('checkIfFished');
      bot.removeTimeTask('rotationBot');
      bot.createTimeTask('fishingIntervalCheck', 40, fishingIntervalCheck);
      bot.createTimeTask('rotationBot', bot.getConfig(pluginName, 'rotationIntervalTick'), rotationBot, true);
      bot._isFishing = true;
    }

    bot.stopFishing = () => {
      bot.baseInfo(pluginName, 'stopFishing');
      bot.removeTimeTask('rotationBot');
      bot.removeTimeTask('fishingIntervalCheck');
      bot.removeTimeTask('throwFishingRodAgain');
      bot.removeTimeTask('checkBobberRetrieved');
      bot.removeTimeTask('checkBobberRetrieved_timeOut');
      bot.removeListener('soundEffectHeard', onCatchFish);
      bot.removeListener('entitySpawn', onBobberSpawn);
      bot._client.removeListener('entity_destroy', onBobberDestory);
      bot._isFishing = false;

      if (bot.heldItem?.name === 'fishing_rod' &&
          isBobberExist(bot)
      ) {
        bot.activateItem();
      }
      bot._lastBobber = null;
    }

    const bobberId = bot.supportFeature('fishingBobberCorrectlyNamed') ? 
      bot.registry.entitiesByName.fishing_bobber!.id : 90;


    function onBobberSpawn(entity: prismEntity.Entity) {
      // TODO: 加个距离判断防止误判
      if (bot._isFishing && entity.entityType === bobberId && !bot._lastBobber) {
        bot._lastBobber = entity;
      }
    }

    function onBobberDestory(packet: any) {
      if (!bot._lastBobber || !bot._isFishing) return;
      if (packet.entityIds.some((id: number) => id === bot._lastBobber!.id)) {
        bot._lastBobber = null;
        throwFishingRodAgain(bot);
      }
    }

    function onCatchFish(sound: string) {
      if (!bot._lastBobber || !bot._isFishing) return;
      if (sound !== 'entity.fishing_bobber.retrieve') return;

      function emitfishEvent(bot: mineflayer.Bot) {
        if (!bot.hasTimeTask('catchFish')) {
          // 等钓上的东西进入背包后触发事件
          // TODO: 可以考虑用playerCollect事件代替
          bot.createOnceTimeTask('catchFish', 10, () => {
            bot.emit('fish');
          })
        }
      }

      if (isBobberRetrieved(bot._lastBobber)) {
        bot.activateItem();
        throwFishingRodAgain(bot);
        bot._lastBobber = null;
        emitfishEvent(bot);
        return;
      }
      bot.removeTimeTask('checkBobberRetrieved_timeOut');
      bot.createOnceTimeTask('checkBobberRetrieved_timeOut', 5, () => {
        bot.removeTimeTask('checkBobberRetrieved');
      })

      if (bot.hasTimeTask('checkBobberRetrieved')) {
        return;
      }
      
      bot.createTimeTask('checkBobberRetrieved', 1, bot => {
        if (bot.isBobberExist() && isBobberRetrieved(bot._lastBobber!)) {
          bot.activateItem();
          throwFishingRodAgain(bot);
          bot._lastBobber = null;
          emitfishEvent(bot);
          bot.removeTimeTask('checkBobberRetrieved');
          bot.removeTimeTask('checkBobberRetrieved_timeOut');
        }
      })
    }

    registCmd(bot);
    pluginReady(bot, pluginName);
}

declare module 'mineflayer' {
  interface Bot {
    _isFishing: boolean,
    _lastBobber: prismEntity.Entity | null,
    _bobberNotInWaterTick: number,
    _rotationIndex: number,
    isBobberExist(): boolean,
    heldFishRod(): Promise<void> | void,
    startFishing(): Promise<void>,
    stopFishing(): void,
  }

  interface BotEvents {
    fish: void,
  }
}

interface FishmanConfig {
  enableRotation: boolean,
  fishingRodProtect: boolean,
  rotationIntervalTick: number,
  rotationData: {yaw: number, pitch: number}[]
}