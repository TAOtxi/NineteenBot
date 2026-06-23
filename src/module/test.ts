import mineflayer, { type Anvil } from "mineflayer";
import prisItem from 'prismarine-item';
import { simplify } from "prismarine-nbt";
import loader from 'prismarine-chat';
import { Vec3 } from 'vec3';

function padZero(num: number, length: number = 2) {
  return num.toString().padStart(length, '0');
}


function testCmd(bot: mineflayer.Bot) {
  const CommandManager = bot.getCommandManager();
  bot.registerCmd(CommandManager.command('test')
    .then(CommandManager.command('openBlock')
      .then(CommandManager.value("<position>")
        .execute(async (bot, position) => {
          const arr = position.replaceAll(" ", "").split(',');
          const posVec3 = new Vec3(Number(arr[0]), Number(arr[1]), Number(arr[2]));
          const block = bot.blockAt(posVec3);
          if (!block) {
            console.log('block not found');
            return;
          }
          const window = await bot.openAnvil(block);
        })))
    .then(CommandManager.command('block')
      .then(CommandManager.value("<position>")
        .execute((bot, position) => {
          const arr = position.replaceAll(" ", "").split(',');
          if (arr.length !== 3) {
            console.log('position error');
            return;
          }
          const block = bot.blockAt(new Vec3(Number(arr[0]), Number(arr[1]), Number(arr[2])));
          console.log(block);
        })))
    .then(CommandManager.command("showChestItem")
      .execute(bot => {
        const type = bot.currentWindow?.type;
        if (type !== "minecraft:generic_9x6" && type !== "minecraft:generic_9x3") {
          bot.baseInfo("TEST", "chest not found");
          return;
        };

        const option = {
          count: true,
          enchant: true,
          durability: true,
        }
        for (let i=0; i<bot.currentWindow!.inventoryStart; i++) {
          const item = bot.currentWindow!.slots[i];
          if (!item) continue;
          
          const info = bot.showItemInfoInline(item, option);
          bot.baseInfo("TEST", `[${padZero(i)}] ${info}`);
        }
      }))
    .then(CommandManager.command('combine')
      .then(CommandManager.value('<slot1, slot2>')
        .execute(async (bot, slots) => {
          const matcher = slots.match(/^(\d+)[,，]\s*(\d+)$/);
          if (!matcher) {
            bot.baseError("TEST", 'Invalid slot format');
            return;
          }
          const slot1 = parseInt(matcher[1]!) - 6;
          const slot2 = parseInt(matcher[2]!) - 6;

          let window = bot.currentWindow as Anvil;
          if (bot.currentWindow?.type !== "minecraft:anvil") {
            bot.currentWindow && bot.closeWindow(bot.currentWindow);
            const anvilBlock = bot.findBlock({
              maxDistance: 4.5,
              matching: block => /_?anvil$/.test(block.name)
            });
            if (anvilBlock === null) {
              bot.baseError("TEST", 'Anvil not found');
              return;
            }
            window = await bot.openAnvil(anvilBlock);
          }

          if (window.type !== "minecraft:anvil") {
            bot.baseError("TEST", 'Not anvil window');
            return;
          }
          
          if (!window.slots[slot1] || !window.slots[slot2]) {
            bot.baseError("TEST", 'Slot is empty');
            return;
          }
          console.log('combine1', bot.showItemInfoInline(window.slots[slot1]));
          console.log('combine2', bot.showItemInfoInline(window.slots[slot2]));

          await window.combine(window.slots[slot1], window.slots[slot2]);
          bot.closeWindow(window);
        })))
    .then(CommandManager.command('testAnvil')
      .then(CommandManager.value('<slot1, slot2>')
        .execute(async (bot, slots) => {
          const matcher = slots.match(/^(\d+)[,，]\s*(\d+)$/);
          if (!matcher) {
            bot.baseError("TEST", 'Invalid slot format');
            return;
          }
          const slot1 = parseInt(matcher[1]!) - 6;
          const slot2 = parseInt(matcher[2]!) - 6;
          
          const window = await bot.openNearstAnvil();

          if (!window) {
            bot.baseError("TEST", 'Anvil not found');
            return;
          }
          
          if (!window.slots[slot1] || !window.slots[slot2]) {
            bot.baseError("TEST", 'Slot is empty');
            return;
          }
          console.log('combine1', bot.showItemInfoInline(window.slots[slot1]));
          console.log('combine2', bot.showItemInfoInline(window.slots[slot2]));
          await bot.anvilCombine(window.slots[slot1], window.slots[slot2]);
          bot.closeWindow(window);
        })))
      .then(CommandManager.command('carryTest')
        .execute(async bot => {
          console.log(bot.inventory.selectedItem);
          await bot.clickWindow(36, 0, 0);
          console.log('36', bot.inventory.slots[36]);
          console.log(bot.inventory.selectedItem);
          await bot.clickWindow(25, 0, 0);
          console.log('25', bot.inventory.slots[25]);
          console.log(bot.inventory.selectedItem);
        }))
  );

  // bot._client.on('chat', (packet) => {
  //   console.log('chat', JSON.stringify(packet, null, 2));
  // })

  // bot._client.on('systemChat', (packet) => {
  //   console.log('systemChat', JSON.stringify(packet, null, 2));
  // })

  // bot._client.on('playerChat', (packet) => {
  //   console.log('playerChat', JSON.stringify(packet, null, 2));
  // })

  // bot._client.on('declare_commands', (packet) => {
  //   console.log('declare_commands', JSON.stringify(packet, null, 2));
  // })

  // @ts-ignore
  // bot.inventory.on('updateSlot:0', (oldItem, newItem) => {
  //   console.log('updateSlot', oldItem, newItem);
  // })

  // bot._client.on('player_info', (packet) => {
  //   console.log('player_info', JSON.stringify(packet, null, 2));
  // })

  // bot._client.on('named_entity_spawn', (packet) => {
  //   console.log('named_entity_spawn', JSON.stringify(packet, null, 2));
  // })

  // bot._client.on('player_remove', (packet) => {
  //   console.log('player_remove', JSON.stringify(packet, null, 2));
  // })
}

export default testCmd;