import mineflayer from 'mineflayer';
import prismEntity from 'prismarine-entity';
import { pluginReady, waitPluginLoads } from '../utils/pluginWaiter.js';
import StringUtil from '../utils/StringUtil.js';

const pluginName = 'fishman'

const defaultConfig: FishmanConfig = {
  enableRotation: true,
  fishingRodProtect: true,
  throwDelay: 5,
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
  return bot.bobber !== null &&
    bot.entities[bot.bobber!.id] !== undefined;
}

function shouldThrowAgain(bot: mineflayer.Bot) {
  if (!bot.bobber) {
    throw new Error('Bobber not found');
  }

  const bobberPos = bot.bobber.position;
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
  if (bot.bobber.metadata[8] && Number(bot.bobber.metadata[8]) - 1 !== 0) {
    return true;
  }

  return false;
}

async function fishingIntervalCheck(bot: mineflayer.Bot) {
  if (bot.heldItem?.name !== 'fishing_rod') {
    bot.baseError(pluginName, 'Not holding fishing rod');
    bot.stopFishing();
    return;
  }

  // 检查鱼钩是否存在
  if (!bot.isBobberExist()) {
    bot.bobber = null;
    throwFishingRodAgain(bot);
    return;
  }

  // 检查是否需要重新抛钩
  if (shouldThrowAgain(bot)) {
    bot.bobber = null;
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
      .execute(bot => bot.withoutLogTitle().baseInfo(pluginName, JSON.stringify(bot.bobber))))
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
    )
    .then(CommandManager.command('config')
      .then(CommandManager.command('reload')
        .execute(bot => {
          bot.loadConfig(pluginName, defaultConfig);
        }))
      .then(CommandManager.command('reset')
        .execute(bot => bot.saveConfig(pluginName, defaultConfig)))
      .then(CommandManager.command('show')
        .then(CommandManager.value('<property>')
          .suggests(Object.keys(defaultConfig))
          .execute((bot, property) => {
            bot.baseInfo(pluginName, `${property}: ${JSON.stringify(bot.getConfig(pluginName, property), null, 2)}`);
          }))
      )
    )
    .then(CommandManager.command('clean')
      .execute(bot => {
        const yaw = bot.entity.yaw;
        const pitch = bot.entity.pitch;
        
        const nearestPlayer = bot.findNearestPlayer();
        if (!nearestPlayer) {
          bot.baseError(pluginName, 'No player found.');
          return;
        }
        bot.lookAt(nearestPlayer.entity.position, true);
        bot.createOnceTimeTask('cleanBagAndTurnBack', 10, () => {
          const l = bot.inventory.inventoryStart;
          const r = bot.inventory.inventoryEnd;
          for (let i = l; i <= r; i++) {
            if (bot.inventory.slots[i] && bot.inventory.slots[i]!.name !== 'fishing_rod') {
              bot.clickWindow(i, 1, 4)
            }
          }
          bot.look(yaw, pitch, true);
        })
      }))
    .then(CommandManager.command('throwDelay')
      .then(CommandManager.value('<delay>')
        .execute((bot, value) => {
          bot.setConfig(pluginName, 'throwDelay', parseInt(value));
          bot.baseInfo(pluginName, `Throw delay set to ${parseInt(value)}`);
        }))
    )
  );
}

function isBobberCatchable(bobber: prismEntity.Entity) {
  // See https://minecraft.wiki/w/Java_Edition_protocol/Entity_metadata#Fishing_Bobber
  return bobber.metadata?.[9]
}

function throwFishingRodAgain(bot: mineflayer.Bot) {
  if (bot.heldItem?.name !== 'fishing_rod') {
    bot.baseError(pluginName, 'Not holding fishing rod.');
    bot.stopFishing();
    return;
  }

  if (bot.getConfig(pluginName, 'fishingRodProtect') && 
      bot.heldItem.maxDurability - bot.heldItem.durabilityUsed <= 5
  ) {
    bot.baseError(pluginName, 'Fishing rod is almost broken.');
    bot.stopFishing();
    return;
  }

  if (bot.hasTimeTask('throwFishingRodAgain')) {
    return;
  }
  bot.createOnceTimeTask('throwFishingRodAgain', bot.getConfig(pluginName, 'throwDelay'), () => {
    if (!bot.usingHeldItem || !bot.isBobberExist()) {
      bot.activateItem();
      rotationBot(bot);
    }
  })
}

// 自动转向
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
    bot.bobber = null;
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

      if (bot.heldItem?.name !== 'fishing_rod') {
        bot.baseError(pluginName, 'Not holding fishing rod.');
        return;
      }

      if (bot.getConfig(pluginName, 'fishingRodProtect') &&
          bot.heldItem.maxDurability - bot.heldItem.durabilityUsed <= 5
      ) {
        bot.baseError(pluginName, 'Fishing rod is almost broken. Stop fishing.');
        return;
      }
      bot.bobber = null;

      bot.activateItem();
      
      bot._rotationIndex = 0;
      bot._bobberNotInWaterTick = 0;
      
      cleanup();

      bot.on('entitySpawn', onBobberSpawn);
      bot.on('soundEffectHeard', onCatchFish);
      bot._client.on('entity_destroy', onBobberDestory);
      bot.createTimeTask('fishingIntervalCheck', 40, fishingIntervalCheck);
      bot._isFishing = true;
    }

    bot.stopFishing = () => {
      bot.baseInfo(pluginName, 'stopFishing');
      cleanup();
    }

    function cleanup() {
      bot.removeTimeTask('fishingIntervalCheck');
      bot.removeTimeTask('throwFishingRodAgain');
      bot.removeTimeTask('checkBobberCatchable');
      bot.removeTimeTask('checkBobberCatchable_timeOut');
      bot.removeListener('soundEffectHeard', onCatchFish);
      bot.removeListener('entitySpawn', onBobberSpawn);
      bot._client.removeListener('entity_destroy', onBobberDestory);
      bot._isFishing = false;

      if (bot.heldItem?.name === 'fishing_rod' &&
          bot.isBobberExist()
      ) {
        bot.activateItem();
      }
      bot.bobber = null;
    }

    const bobberId = bot.supportFeature('fishingBobberCorrectlyNamed') ? 
      bot.registry.entitiesByName.fishing_bobber!.id : 90;


    function onBobberSpawn(entity: prismEntity.Entity) {
      if (
          bot._isFishing && 
          entity.entityType === bobberId && 
          !bot.isBobberExist() &&
          entity.position.distanceSquared(bot.entity.position) < 2.72 // 实际上约为 2.714400007228016
        ) {
        bot.bobber = entity;
      }
    }

    function onBobberDestory(packet: any) {
      if (!bot.bobber || !bot._isFishing) return;
      if (packet.entityIds.some((id: number) => id === bot.bobber!.id)) {
        bot.bobber = null;
        throwFishingRodAgain(bot);
      }
    }

    function onCatchFish(sound: string) {
      if (!bot.bobber || !bot._isFishing) return;
      if (sound !== 'entity.fishing_bobber.retrieve') return;

      function catchFish() {
        bot.bobber = null;
        bot.activateItem();
        if (bot.hasTimeTask('fishingIntervalCheck')) {
          bot.restartTimeTask('fishingIntervalCheck');
        }
        throwFishingRodAgain(bot);
        bot.emit('fish');
      }

      if (isBobberCatchable(bot.bobber)) {
        catchFish();
        return;
      }

      bot.removeTimeTask('checkBobberCatchable_timeOut');
      bot.createOnceTimeTask('checkBobberCatchable_timeOut', 5, () => {
        bot.removeTimeTask('checkBobberCatchable');
      })

      if (bot.hasTimeTask('checkBobberCatchable')) {
        return;
      }
      
      bot.createTimeTask('checkBobberCatchable', 1, bot => {
        if (bot.isBobberExist() && isBobberCatchable(bot.bobber!)) {
          catchFish();
          bot.removeTimeTask('checkBobberCatchable');
          bot.removeTimeTask('checkBobberCatchable_timeOut');
        }
      })
    }

    registCmd(bot);

    bot.on('cleanup', cleanup);

    pluginReady(bot, pluginName);
}

declare module 'mineflayer' {
  interface Bot {
    _isFishing: boolean,
    bobber: prismEntity.Entity | null,
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
  throwDelay: number,
  rotationData: {yaw: number, pitch: number}[]
}