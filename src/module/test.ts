import mineflayer from "mineflayer";



function testCmd(bot: mineflayer.Bot) {
  const CommandManager = bot.getCommandManager();
  bot.registerCmd(CommandManager.command('test')
    .then(CommandManager.command('1')
      .execute(async bot => {
        const itemType = bot.registry.itemsArray.find(i => i.name === 'stone_pickaxe')?.id!;
        const craftingTable = bot.findBlock({ matching: b => b.name === 'crafting_table', maxDistance: 5 })!
        const recipes = bot.recipesFor(itemType, null, 1, craftingTable);
        console.log('recipes', recipes[0]);
        const result = await bot.craft(recipes[0]!, 1, craftingTable);
        console.log(result);
      })))

  bot._client.on('chat', (packet) => {
    console.log('chat', JSON.stringify(packet, null, 2));
  })

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