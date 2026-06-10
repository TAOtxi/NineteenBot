import mineflayer from "mineflayer";
import { simplify } from "prismarine-nbt";
import loader from 'prismarine-chat';
import { Vec3 } from 'vec3';

function padZero(num: number, length: number = 2) {
  return num.toString().padStart(length, '0');
}


function testCmd(bot: mineflayer.Bot) {
  const CommandManager = bot.getCommandManager();
  bot.registerCmd(CommandManager.command('test')
    .then(CommandManager.command('openChest')
      .execute(bot => {
        const chestBlock = bot.findBlock({ matching: b => b.name === 'chest' });
        if (!chestBlock) {
          console.log('chest not found');
          return;
        }
        bot.openChest(chestBlock);
      }))
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
  )

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