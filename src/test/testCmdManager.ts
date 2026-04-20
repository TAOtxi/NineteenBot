import { CommandManager } from "../plugins/command.js";

const cmd = new CommandManager('look', 'cmd');

cmd
  .then(CommandManager.command('up'))
  .then(CommandManager.command('down'))
  .then(CommandManager.command('left'))
  .then(CommandManager.command('right')
    .then(CommandManager.command('x')))
  .then(CommandManager.command('set')
    .then(CommandManager.argument('x'))
    .then(CommandManager.argument('y'))
    .then(CommandManager.argument('z'))
    .execute(bot => console.log(bot))
  );

// cmd.view();
console.log(cmd);




