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

  // @ts-ignore
  // bot.inventory.on('updateSlot:0', (oldItem, newItem) => {
  //   console.log('updateSlot', oldItem, newItem);
  // })
}

export default testCmd;