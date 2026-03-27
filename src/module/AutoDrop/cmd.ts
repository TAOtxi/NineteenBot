import type CmdParser from '../../utils/CmdParser.js';
import Drop from './main.js';

function enable() {
  if (Drop.isEnabled()) {
    Drop.getLogger().info('It is already enabled.');
    return;
  }
  Drop.setEnabled(true);
  Drop.getLogger().info('AutoDrop is enabled.');
}

function disable() {
  if (!Drop.isEnabled()) {
    Drop.getLogger().info('It is already disabled.');
    return;
  }
  Drop.setEnabled(false);
  Drop.getLogger().info('AutoDrop is disabled.');
}

function setMode(value: string) {
  if (value !== 'whitelist' && value !== 'blacklist') {
    Drop.getLogger().info(`Invalid mode ${value}.`);
    return;
  }
  Drop.getConfig().dropMode = value;
  Drop.getLogger().info(`Set mode ${value}.`);
}

function reload() {
  Drop.loadConfig();
  Drop.getLogger().info('Config reloaded.');
}

function showHelp() {
  Drop.getLogger().withoutPrefix().info('======================== AutoDrop help ========================');
  Drop.getLogger().withoutPrefix().info('ad | autodrop');
  Drop.getLogger().withoutPrefix().info('  on: enable AutoDrop');
  Drop.getLogger().withoutPrefix().info('  off: disable AutoDrop');
  Drop.getLogger().withoutPrefix().info('  check: check items now, ignore whether disabled or not');
  Drop.getLogger().withoutPrefix().info('  reload: reload AutoDrop config');
  Drop.getLogger().withoutPrefix().info('  help: show this help');
  Drop.getLogger().withoutPrefix().info('  config: show current config');
  Drop.getLogger().withoutPrefix().info('  -mode <mode>: set drop mode to <mode>');
  Drop.getLogger().withoutPrefix().info('                valid mode: whitelist, blacklist');
  Drop.getLogger().withoutPrefix().info('  -ig, --ignore <slot>: ignore <slot> when dropping items');
  Drop.getLogger().withoutPrefix().info('                        if <slot> is -1, it will ignore the player\'s');
  Drop.getLogger().withoutPrefix().info('                        existing backpack items');
  Drop.getLogger().withoutPrefix().info('                reset: reset ignore slots');
  Drop.getLogger().withoutPrefix().info('  -it, --interval <tick>: set tick interval check items');
  Drop.getLogger().withoutPrefix().info('  -d, --direction <direction>: set drop direction to <direction>');
  Drop.getLogger().withoutPrefix().info('       valid direction: up, down, west, east, south, north, look');
  Drop.getLogger().withoutPrefix().info('===============================================================');
}

function handleIgnoreCmd(value: string) {
  if (value === 'reset') {
    Drop.getConfig().ignoreSlots = [];
    Drop.getLogger().info('Ignore slots reset.');
  } else if (value === '-1') {
    Drop.getConfig().ignoreSlots = Drop.getNoneEmptySlot();
    Drop.getLogger().info('Ignore slots set to all existing backpack items.');
  } else if (value.match(/^\d+$/)) {
    const slot = parseInt(value);
    if (Drop.getConfig().ignoreSlots.includes(slot)) {
      Drop.getLogger().info(`Slot ${slot} is already ignored.`);
      return false;
    }
    Drop.getConfig().ignoreSlots.push(slot);
    Drop.getLogger().info(`Ignore slot ${slot}.`);
  } else {
    Drop.getLogger().info(`Invalid slot ${value}.`);
    return false;
  }
  return true;
}

function getAllDirection() {
  return ['up', 'down', 'west', 'east', 'south', 'north', 'look'];
}

// 返回值代表是否正确处理了命令
export default function handleCmd(parseCmd: CmdParser) {
  if (parseCmd.isCmd(['help', '?']) || parseCmd.isEmptyCmd()) {
    showHelp();
  } else if (parseCmd.isCmd('on')) {
    enable();
  } else if (parseCmd.isCmd('off')) {
    disable();
  } else if (parseCmd.isCmd('check')) {
    Drop.tick(true);
  } else if (parseCmd.isCmd('reload')) {
    reload();
  } else if (parseCmd.isCmd('config')) {
    Drop.getLogger().info("\n" + JSON.stringify(Drop.getConfig(), null, 2));
  } 
  
  else if (parseCmd.hasArg(['-m', '--mode'])) {
    setMode(parseCmd.getValue(['-m', '--mode'])!);
  } 
  
  else if (parseCmd.hasArg(['-ig', '--ignore'])) {
    return handleIgnoreCmd(parseCmd.getValue(['-ig', '--ignore'])!);
  } 
  
  else if (parseCmd.hasArg(['-it', '--interval'])) {
    const value = parseCmd.getValue(['-it', '--interval'])!;
    if (!value.match(/^\d+$/)) {
      Drop.getLogger().info(`Invalid tick interval ${value}.`);
      return false;
    }
    const checkInterval = parseInt(value);
    Drop.getConfig().checkInterval = checkInterval;
    Drop.getLogger().info(`Set tick interval check items to ${checkInterval}.`);
  } 
  
  else if (parseCmd.hasArg(['-d', '--direction'])) {
    const direction = parseCmd.getValue(['-d', '--direction'])!;
    if (getAllDirection().includes(direction)) {
      // @ts-ignore
      Drop.getConfig().dropDirection = direction;
      Drop.getLogger().info(`Set drop direction to ${direction}.`);
    } else {
      Drop.getLogger().info(`Invalid direction ${direction}.`);
      Drop.getLogger().info(`Valid direction: ${getAllDirection().join(', ')}`);
      return false;
    }
  } 
  
  else {
    Drop.getLogger().info(`Invalid command ${parseCmd.getRawCmd()}.`);
    return false;
  }
  return true;
}



