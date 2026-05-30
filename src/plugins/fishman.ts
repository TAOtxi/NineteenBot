import mineflayer from 'mineflayer';
import prismEntity from 'prismarine-entity';
import { pluginReady, waitPluginLoads } from '../utils/pluginWaiter.js';
import StringUtil from '../utils/StringUtil.js';

const pluginName = 'fishman'

const defaultConfig: FishmanConfig = {
  enableRotation: true,
  fishingRodProtect: true,
  throwDelay: 5,
  autodrop: true,
  triggerDropBy: '',  // diamond
  dropTimeoutIfNotTrigger: 1200,
  rotationData: [
    { yaw: 0, pitch: 30 },
    { yaw: -90, pitch: 30 },
  ]
}


function heldFishRod(bot: mineflayer.Bot) {
  if (bot.heldItem?.name === 'fishing_rod') {
    return;
  }
  return bot.equip(bot.registry.itemsByName.fishing_rod!.id, 'hand')
}


function isBobberExist(bot: mineflayer.Bot) {
  return bot.bobber !== null && bot.bobber.isValid;
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
              [...bot.getConfig(pluginName, 'rotationData'), { yaw: Number(yawPitch[0]), pitch: Number(yawPitch[1]) }]);
          })))
      .then(CommandManager.command('clear').execute(bot => bot.setConfig(pluginName, 'rotationData', [])))
    )
    .then(CommandManager.command('config')
      .then(CommandManager.command('reload')
        .execute(bot => {
          bot.loadConfig(pluginName, defaultConfig);
          if (bot.hasTimeTask('dropTimeoutIfNotTrigger')) {
            bot.updateTimeTask('dropTimeoutIfNotTrigger', bot.getConfig(pluginName, 'dropTimeoutIfNotTrigger'));
          }
          bot._triggerItemId = bot.registry.itemsByName[bot.getConfig(pluginName, 'triggerDropBy')]?.id ?? -1;
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

        if (bot.admins && bot.admins.length > 0) {
          const admin = bot.players[bot.admins[0]!];
          if (admin?.entity?.position) {
            bot.lookAt(
              // @ts-ignore
              admin.entity.position.offset(0, admin.entity.eyeHeight, 0),
              true
            );
          } else {
            const nearestPlayer = bot.findNearestPlayer();
            if (nearestPlayer?.entity?.position) {
              bot.lookAt(
                // @ts-ignore
                nearestPlayer.entity.position.offset(0, nearestPlayer.entity.height, 0),
                true
              );
            }
          }
        }

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
        })))
    .then(CommandManager.command('autodrop')
      .then(CommandManager.command('on').execute(bot => bot.startFishAutoDrop()))
      .then(CommandManager.command('off').execute(bot => bot.stopFishAutoDrop())))
  );
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

      if (bot.getConfig(pluginName, 'enableRotation')) {
        rotationBot(bot);
      }
    }
  })
}

// 自动转向
function rotationBot(bot: mineflayer.Bot) {
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

export default async function inject(bot: mineflayer.Bot) {
  await waitPluginLoads(bot, ['logger', 'task', 'command', 'makeConfig']);
  bot.loadConfig(pluginName, defaultConfig);

  bot._isFishing = false;
  bot.bobber = null;
  bot._bobberNotInWaterTick = 0;
  bot._rotationIndex = 0;
  bot._triggerItemId = -1;
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
    cleanup();

    bot.activateItem();

    if (bot.getConfig(pluginName, 'autodrop')) {
      bot.startFishAutoDrop();
    }

    bot.on('entitySpawn', onBobberSpawn);
    bot.on('entityUpdate', onCatchFish);
    bot.on('entityGone', onBobberDestory);
    bot.createTimeTask('fishingIntervalCheck', 40, fishingIntervalCheck);
    bot._isFishing = true;
  }

  bot.stopFishing = () => {
    bot.baseInfo(pluginName, 'stopFishing');
    cleanup();
  }

  bot.startFishAutoDrop = () => {
    bot.baseInfo(pluginName, 'startFishAutoDrop');
    bot.removeTimeTask('dropTimeoutIfNotTrigger');
    bot.removeListener('playerCollect', onPlayerCollectItem);

    const dropTimeOut = bot.getConfig(pluginName, 'dropTimeoutIfNotTrigger');
    if (dropTimeOut > 0) {
      bot.createTimeTask('dropTimeoutIfNotTrigger', dropTimeOut, () => {
        bot.tryDrop();
      })
    }
    bot.on('playerCollect', onPlayerCollectItem);

    if (!bot.getConfig(pluginName, 'autodrop')) {
      bot.setConfig(pluginName, 'autodrop', true);
    }
    bot._triggerItemId = bot.registry.itemsByName[bot.getConfig(pluginName, 'triggerDropBy')]?.id ?? -1;
  }

  bot.stopFishAutoDrop = () => {
    bot.baseInfo(pluginName, 'stopFishAutoDrop');
    bot.removeTimeTask('dropTimeoutIfNotTrigger');
    bot.removeListener('playerCollect', onPlayerCollectItem);

    if (bot.getConfig(pluginName, 'autodrop')) {
      bot.setConfig(pluginName, 'autodrop', false);
    }
  }

  function onPlayerCollectItem(player: prismEntity.Entity, item: prismEntity.Entity) {
    if (bot._triggerItemId === -1) {
      // bot.baseError(pluginName, `Illegal trigger item: ${bot.getConfig(pluginName, 'triggerDropBy')}`);
      return;
    }
    if (player.username !== bot.username) return;
    // @ts-ignore  // https://minecraft.wiki/w/Java_Edition_protocol/Slot_data
    if (bot._triggerItemId !== item.metadata[8]?.itemId) return;

    bot.tryDrop();
    bot.restartTimeTask('dropTimeoutIfNotTrigger');
  }

  function cleanup() {
    bot.removeTimeTask('fishingIntervalCheck');
    bot.removeTimeTask('throwFishingRodAgain');
    bot.removeListener('entitySpawn', onBobberSpawn);
    bot.removeListener('entityGone', onBobberDestory);
    bot.removeListener('playerCollect', onPlayerCollectItem);
    bot.removeTimeTask('dropTimeoutIfNotTrigger');
    bot._rotationIndex = 0;
    bot._bobberNotInWaterTick = 0;
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

  function onBobberDestory(entity: prismEntity.Entity) {
    if (!bot.bobber || !bot._isFishing) return;
    if (entity === bot.bobber) {
      bot.bobber = null;
      throwFishingRodAgain(bot);
    }
  }

  function onCatchFish(entity: prismEntity.Entity) {
    if (!bot.bobber || !bot._isFishing) return;
    if (entity !== bot.bobber) return;

    // See https://minecraft.wiki/w/Java_Edition_protocol/Entity_metadata#Fishing_Bobber
    if (bot.bobber.metadata[9]) {
      bot.bobber = null;
      bot.activateItem();
      throwFishingRodAgain(bot);
      bot.emit('fish');
    }
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
    _triggerItemId: number,
    isBobberExist(): boolean,
    heldFishRod(): Promise<void> | void,
    startFishing(): Promise<void>,
    stopFishing(): void,
    startFishAutoDrop(): void,
    stopFishAutoDrop(): void,
  }

  interface BotEvents {
    fish: void,
  }
}

interface FishmanConfig {
  enableRotation: boolean,
  fishingRodProtect: boolean,
  throwDelay: number,
  autodrop: boolean,
  triggerDropBy: string,
  dropTimeoutIfNotTrigger: number,
  rotationData: { yaw: number, pitch: number }[]
}