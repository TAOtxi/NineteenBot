import fuzzy from 'fuzzy';
import type mineflayer from 'mineflayer';
import { CommandManager, CommandType } from '@/plugins/command.js';
import CmdParser from '@/utils/CmdParser.js';

function getMatch(cmd: string | undefined, tips: CommandManager[]) {
  const cmdList = tips.map(item => item.name).flat();
  const filteredTips = fuzzy.filter(cmd || '', cmdList);
  return filteredTips.map(item => item.string).sort();
}

function getMatchFromArray(cmd: string | undefined, tips: string[]) {
  const filteredTips = fuzzy.filter(cmd || '', tips);
  return filteredTips.map(item => item.string).sort();
}

export function getInput(input: string, bot: mineflayer.Bot) {
  if (input.trim() === '') {
    return getMatch('', bot._cmdMap);
  }

  const parseCmd = new CmdParser(input);
  const partLen = parseCmd.getCmds().length + (input.at(-1) === ' ' || parseCmd.hasAnyArg() ? 1 : 0);

  let currentCmdMap = bot._cmdMap;

  for (let i = 0; i < partLen; i++) {
    if (!currentCmdMap || currentCmdMap.length === 0) {
      return [];
    }

    let cmdPart = '';
    if (i === partLen - 1 && parseCmd.hasAnyArg()) {
      cmdPart = parseCmd.getPart(-1) || '';
    } else {
      cmdPart = parseCmd.getFirstCmd() || '';
    }

    let hasCommand = false;
    for (const sub of currentCmdMap) {
      if (sub.level === partLen) {
        if (sub.type === CommandType.VALUE) {
          if (typeof sub.suggest === 'function') {
            return getMatchFromArray(cmdPart, sub.suggest());
          } else if (sub.suggest.length > 0) {
            return getMatchFromArray(cmdPart, sub.suggest);
          }
          return [sub.name] as string[];
        };
        return getMatch(cmdPart, currentCmdMap);
      }

      if (parseCmd.isCmd(sub.name) && sub.subCmds) {
        hasCommand = true;
        currentCmdMap = sub.subCmds;
        parseCmd.dive();
        break;
      }
    }
    if (!hasCommand) {
      break;
    }
  }

  return [];
}
