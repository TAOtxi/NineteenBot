import createBot from "./createBot.js";
import command from "../plugins/command.js";
import helper from "../plugins/helper.js";
import { waitPluginLoads } from "../utils/pluginWaiter.js";

const bot = createBot();
bot.loadPlugins([command, helper]);

await waitPluginLoads(bot, ['helper']);

const CommandManager = bot.getCommandManager();
bot.registerCmd(CommandManager.command('quit'))
bot.registerCmd(CommandManager.command(['cls', 'clear']))
bot.registerCmd(CommandManager.command('list'))
bot.registerCmd(CommandManager.command('.'))

const actCmd = CommandManager.command(['act', 'action']).execute(bot => console.log(1))
  .then(CommandManager.command('info').execute(bot => console.log(2)))
  .then(CommandManager.command('stop').execute(bot => console.log(3))
    .then(CommandManager.command(['jump', 'sneak', 'look', 'swing'])))
  .then(CommandManager.command('spin').execute((bot, args) => console.log(4, args))
    .then(CommandManager.argument(['-a', '--angle']).execute((bot, angle) => console.log(5, angle))))
  .then(CommandManager.command('jump')
    .then(CommandManager.argument(['-i', '--interval'])))
  .then(CommandManager.command('sneak')
    .then(CommandManager.argument(['-i', '--interval'])))
  .then(CommandManager.command('swing')
    .then(CommandManager.argument(['-i', '--interval'])
      .execute((bot, interval) => console.log(6, interval)))
    .then(CommandManager.argument(['-h', '--hand'])
      .execute((bot, hand) => console.log(7, hand)))
    .execute((bot, args) => console.log(8, args)))
  .then(CommandManager.command('spec')
    .then(CommandManager.value('<fun>').execute((bot, fun) => console.log(9, fun)))
  )
bot.registerCmd(actCmd);

const infoCmd = CommandManager.command(['info', 'infomation'])
  .then(CommandManager.command(['e', 'entity'])
    .then(CommandManager.argument(['-id', '--identifier']))
    .then(CommandManager.argument(['-n', '--name']))
    .then(CommandManager.argument(['-c', '--count']))
    .then(CommandManager.argument(['-at', '--attribute']))
    .then(CommandManager.argument(['-desc', '--descending']))
    .then(CommandManager.argument(['d', '--distance'])))
  .then(CommandManager.command(['inv', 'inventory'])
    .then(CommandManager.argument(['-id', '--identifier']))
    .then(CommandManager.argument(['-n', '--name']))
    .then(CommandManager.argument(['-e', '--enchant']))
    .then(CommandManager.argument(['-at', '--attribute']))
    .then(CommandManager.argument(['-s', '--slot'])))
bot.registerCmd(infoCmd)


const bhCmd = CommandManager.command(['bh', 'be', 'behavior'])
  .then(CommandManager.command('fish'))
  .then(CommandManager.command('look')
    .then(CommandManager.argument(['-r', '--rotate']))
    .then(CommandManager.argument(['-p', '--position'])))
  .then(CommandManager.command('get'))
  .then(CommandManager.command('set')
    .then(CommandManager.argument(['-p', '--physicsEnabled'])))
bot.registerCmd(bhCmd)


bot.startMonitorInput();