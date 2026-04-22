import createBot from "./createBot.js";
import command from "../plugins/command.js";
import helper from "../plugins/helper.js";


const bot = createBot();
bot.loadPlugin(command);
bot.loadPlugin(helper);

await new Promise(resolve => bot.once('pluginLoaded_helper', () => resolve(1)));

const CommandManager = bot.getCommandManager();
bot.registerCmd(CommandManager.command('quit'))
bot.registerCmd(CommandManager.command(['cls', 'clear']))
bot.registerCmd(CommandManager.command('list'))
bot.registerCmd(CommandManager.command('.'))

const actCmd = CommandManager.command(['act', 'action']).execute(bot => console.log(1))
  .then(CommandManager.command('info').execute(bot => console.log(2)))
  .then(CommandManager.command('stop').execute(bot => console.log(3))
    .then(CommandManager.command(['jump', 'sneak', 'look', 'swing'])))
  .then(CommandManager.command('spin').execute(bot => console.log(4))
    .then(CommandManager.argument(['-a', '--angle']).execute(bot => console.log(5))))
  .then(CommandManager.command('jump')
    .then(CommandManager.argument(['-i', '--interval'])))
  .then(CommandManager.command('sneak')
    .then(CommandManager.argument(['-i', '--interval'])))
  .then(CommandManager.command('swing')
    .then(CommandManager.argument(['-i', '--interval'])))
  .then(CommandManager.command('fun'))
bot.registerCmd(actCmd)

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