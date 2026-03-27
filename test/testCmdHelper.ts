import CmdHelper from "../src/utils/CmdHelper.js";
import CmdParser from "../src/utils/CmdParser.js";
import fuzzy from "fuzzy";

function getMatch(cmd: string | undefined, tips: string[]) {
  const filteredTips = fuzzy.filter(cmd || '', tips);
  // console.clear();
  // console.log(filteredTips);
  return filteredTips.map(item => item.string);
}

function getQuery(parseCmd: CmdParser) {
  if (!parseCmd.getPart(-1)?.startsWith('-') && parseCmd.getPart(-2)?.startsWith('-')) {
    return parseCmd.getPart(-2);
  }
  return parseCmd.getPart(-1);
}

const cmd = await CmdHelper({
  message: "Command:",
  pageSize: 10,
  source: (command: string) => {
    const parseCmd = new CmdParser(command);
    const offset = command.at(-1) === ' ' ? 1 : 0;
    const partLength = parseCmd.getPartLength() + offset;
    if (partLength < 2) {
      return getMatch(parseCmd.getFirstCmd(),
        'info infomation ac act action be behavior quit exit cls clear help .'.split(' ').sort(),
      );
    }

    const query = getQuery(parseCmd);
    if (parseCmd.isCmd(['info', 'infomation'])) {
      parseCmd.dive();
      if (partLength === 2) {
        return getMatch(parseCmd.getFirstCmd(),
          'e entity inv inventory stat'.split(' ').sort(),
        );
      }

      if (partLength >= 3) {
        if (parseCmd.isCmd('stat')) return [];
        if (parseCmd.isCmd(['e', 'entity'])) {
          return getMatch(offset ? '' : query,
            '-id --identifier -n --name -c --count -at --attribute -desc --descending -d --distance'.split(' ').sort().reverse(),
          );
        }
        if (parseCmd.isCmd(['inv', 'inventory'])) {
          return getMatch(offset ? '' : query,
            'show -s --slot -id --identifier -n --name -e --enchant -at --attribute'.split(' ').sort().reverse(),
          );
        };
      }
    }

    if (parseCmd.isCmd(['ac', 'act', 'action'])) {
      parseCmd.dive();
      if (partLength === 2) {
        return getMatch(parseCmd.getFirstCmd(),
          'info stop look spin jump sneak swing fun'.split(' ').sort(),
        );
      }
      

      if (partLength >= 3) {
        if (parseCmd.isCmd('stop')) {
          return getMatch(parseCmd.dive().getFirstCmd(),
            'spin jump sneak swing look spc'.split(' ').sort(),
          );
        }

        if (parseCmd.isCmd('spin')) {
          return getMatch(query,
            '-a --angle'.split(' ').sort(),
          );
        }
        
        if (parseCmd.isCmd(['jump', 'sneak', 'swing'])) {
          return getMatch(query,
            '-i --interval'.split(' ').sort(),
          );
        }
      }
    }

    if (parseCmd.isCmd(['bh', 'behavior'])) {
      parseCmd.dive();
      if (partLength === 2) {
        return getMatch(parseCmd.getFirstCmd(),
          'look fish get set'.split(' ').sort(),
        );
      }

      if (partLength >= 3) {
        if (parseCmd.isCmd('look')) {
          return getMatch(query,
            '-r --rotate -p --position'.split(' ').sort(),
          );
        }

        if (parseCmd.isCmd('fish')) return [];
        if (parseCmd.isCmd('get')) return [];
        if (parseCmd.isCmd('set')) {
          return getMatch(query,
            '-s --slot -id --identifier -n --name -e --enchant -at --attribute'.split(' ').sort(),
          );
        }
      }
    }
    return [];
  },
})
