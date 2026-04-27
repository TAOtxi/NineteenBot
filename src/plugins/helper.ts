import {
  createPrompt,
  useState,
  useKeypress,
  usePrefix,
  usePagination,
  useEffect,
  useMemo,
  useRef,
  isDownKey,
  isEnterKey,
  isTabKey,
  isUpKey,
  Separator,
  makeTheme,
  type Theme,
  type Status,
} from '@inquirer/core';
import { styleText } from 'node:util';
import figures from '@inquirer/figures';
import type { PartialDeep } from '@inquirer/type';

type SearchTheme = {
  icon: { cursor: string };
  style: {
    disabled: (text: string) => string;
    tipTerm: (text: string) => string;
    description: (text: string) => string;
    keysHelpTip: (keys: [key: string, action: string][]) => string | undefined;
  };
};

const searchTheme: SearchTheme = {
  icon: { cursor: figures.pointer },
  style: {
    disabled: (text: string) => styleText('dim', `- ${text}`),
    tipTerm: (text: string) => styleText('cyan', text),
    description: (text: string) => styleText('cyan', text),
    keysHelpTip: (keys: [string, string][]) =>
      keys
        .map(([key, action]) => `${styleText('bold', key)} ${styleText('dim', action)}`)
        .join(styleText('dim', ' • ')),
  },
};

type Choice = {
  value: string;
  name?: string;
  description?: string;
  short?: string;
  disabled?: boolean | string;
  type?: never;
};

type NormalizedChoice = {
  value: string;
  name: string;
  description?: string;
  short: string;
  disabled: boolean | string;
};

type SearchConfig<
  ChoicesObject =
    | ReadonlyArray<string | Separator>
    | ReadonlyArray<Choice | Separator>,
> = {
  message: string;
  source: (
    term: string,
    opt: { signal: AbortSignal },
  ) => ChoicesObject extends ReadonlyArray<string | Separator>
    ? ChoicesObject | Promise<ChoicesObject>
    :
        | ReadonlyArray<Choice | Separator>
        | Promise<ReadonlyArray<Choice | Separator>>;
  validate?: (value: string) => boolean | string | Promise<string | boolean>;
  pageSize?: number;
  default?: string;
  theme?: PartialDeep<Theme<SearchTheme>>;
};

type Item = Separator | NormalizedChoice;

function isSelectable(item: Item): item is NormalizedChoice {
  return !Separator.isSeparator(item) && !item.disabled;
}

function normalizeChoices(
  choices: ReadonlyArray<string | Separator> | ReadonlyArray<Choice | Separator>,
): Array<NormalizedChoice | Separator> {
  return choices.map((choice) => {
    if (Separator.isSeparator(choice)) return choice;

    if (typeof choice === 'string') {
      return {
        value: choice,
        name: choice,
        short: choice,
        disabled: false,
      };
    }

    const name = choice.name ?? String(choice.value);
    const normalizedChoice: NormalizedChoice = {
      value: choice.value,
      name,
      short: choice.short ?? name,
      disabled: choice.disabled ?? false,
    };

    if (choice.description) {
      normalizedChoice.description = choice.description;
    }

    return normalizedChoice;
  });
}

const cmdHelper = createPrompt(
  (config: SearchConfig, done: (value: string) => void) => {
    const { pageSize = 7, validate = () => true } = config;
    const theme = makeTheme<SearchTheme>(searchTheme, config.theme);
    const [status, setStatus] = useState<Status>('loading');

    const [fullCommand, setFullCommand] = useState<string>('');
    const [searchResults, setSearchResults] = useState<ReadonlyArray<Item>>([]);
    const [searchError, setSearchError] = useState<string>();
    const defaultApplied = useRef(false);

    const prefix = usePrefix({ status, theme });

    const bounds = useMemo(() => {
      const first = searchResults.findIndex(isSelectable);
      const last = searchResults.findLastIndex(isSelectable);

      return { first, last };
    }, [searchResults]);

    const [active = bounds.first, setActive] = useState<number>();

    useEffect(() => {
      const controller = new AbortController();

      setStatus('loading');
      setSearchError(undefined);

      const fetchResults = async () => {
        try {
          const results = await config.source(fullCommand, {
            signal: controller.signal,
          });

          if (!controller.signal.aborted) {
            const normalized = normalizeChoices(results);

            let initialActive: number | undefined;
            if (!defaultApplied.current && 'default' in config) {
              const defaultIndex = normalized.findIndex(
                (item) => isSelectable(item) && item.value === config.default,
              );
              initialActive = defaultIndex === -1 ? undefined : defaultIndex;
              defaultApplied.current = true;
            }

            setActive(initialActive);
            setSearchError(undefined);
            setSearchResults(normalized);
            setStatus('idle');
          }
        } catch (error: unknown) {
          if (!controller.signal.aborted && error instanceof Error) {
            setSearchError(error.message);
          }
        }
      };

      void fetchResults();

      return () => {
        controller.abort();
      };
    }, [fullCommand]);

    // Safe to assume the cursor position never points to a Separator.
    const selectedChoice = searchResults[active] as NormalizedChoice | void;

    useKeypress(async (key, rl) => {
      if (isEnterKey(key)) {
        setStatus('done');
        done(fullCommand);
        // rl.clearLine(0);
        // rl.write(fullCommand);
      }
      
      else if (isTabKey(key) && selectedChoice) {
        if (!selectedChoice.value) {
          rl.clearLine(0);    // 清除 Tab
          rl.write(fullCommand);
          return;
        }

        let newCommand;
        if (fullCommand.includes(' ')) {
          const prevCommand = fullCommand.slice(0, fullCommand.lastIndexOf(' '));
          newCommand = `${prevCommand} ${selectedChoice.value}`;
        } else {
          newCommand = selectedChoice.value;
        }

        rl.clearLine(0);
        rl.write(newCommand);
        setFullCommand(newCommand);
      }
      
      else if (status !== 'loading' && (isUpKey(key) || isDownKey(key))) {
        // rl.clearLine(0);
        if (
          (isUpKey(key) && active !== bounds.first) ||
          (isDownKey(key) && active !== bounds.last)
        ) {
          const offset = isUpKey(key) ? -1 : 1;
          let next = active;
          do {
            next = (next + offset + searchResults.length) % searchResults.length;
          } while (!isSelectable(searchResults[next]!));
          setActive(next);
        }
      } 
      
      else {
        setFullCommand(rl.line);
      }
    });

    const message = theme.style.message(config.message, status);

    const helpLine = theme.style.keysHelpTip([
      ['↑↓', 'navigate'],
      ['⏎', 'select'],
    ]);

    const page = usePagination({
      items: searchResults,
      active,
      renderItem({ item, isActive }) {
        if (Separator.isSeparator(item)) {
          return ` ${item.separator}`;
        }

        if (item.disabled) {
          const disabledLabel =
            typeof item.disabled === 'string' ? item.disabled : '(disabled)';
          return theme.style.disabled(`${item.name} ${disabledLabel}`);
        }

        const color = isActive ? theme.style.highlight : (x: string) => x;
        const cursor = isActive ? theme.icon.cursor : ` `;
        return color(`${cursor} ${item.name}`);
      },
      pageSize,
      loop: false,
    });

    let error;
    if (searchError) {
      error = theme.style.error(searchError);
    } else if (searchResults.length === 0 && fullCommand !== '' && status === 'idle') {
      error = theme.style.error('No results found');
    }

    let searchStr;
    if (status === 'done' && fullCommand) {
      return [prefix, message, theme.style.answer(fullCommand)]
        .filter(Boolean)
        .join(' ')
        .trimEnd();
    } else {
      searchStr = theme.style.tipTerm(fullCommand);
    }

    const header = [prefix, message, searchStr].filter(Boolean).join(' ').trimEnd();
    const body = [
      error ?? page,
      ' ',
      helpLine,
    ]
      .filter(Boolean)
      .join('\n')
      .trimEnd();

    return [header, body];
  },
);

export { Separator } from '@inquirer/core';

import mineflayer from "mineflayer";
import CmdParser from "../utils/CmdParser.js";
import fuzzy from "fuzzy";
import type { CommandData } from "./command.js";
import { pluginReady, waitPluginLoads } from "../utils/pluginWaiter.js";

const DEBUG = CmdParser.getValueByArgName(process.argv, 'debug') === 'true';


function getMatch(cmd: string | undefined, tips: CommandData[]) {
  const cmdList = tips.map(item => item.name).flat();
  const filteredTips = fuzzy.filter(cmd || '', cmdList);
  return filteredTips.map(item => item.string).sort();
}

async function getInput(bot: mineflayer.Bot) {
  return cmdHelper({
    message: "Command:",
    pageSize: 10,
    source(input: string) {
      if (input.trim() === '') {
        return getMatch('', bot._cmdMap);
      }

      const parseCmd = new CmdParser(input);
      const partLen = parseCmd.getCmds().length + (input.at(-1) === ' ' || parseCmd.hasAnyArg() ? 1 : 0);
      
      let currentCmdMap = bot._cmdMap;
      
      for (let i=0; i<partLen; i++) {
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
          if (DEBUG) {
            console.clear();
            console.log('index', i);
            console.log('cmdPart', `[${cmdPart}]`);
            console.log('partLen', partLen);
            console.log('sub', sub);
          }

          if (sub.level === partLen) {
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
  })
}


export default async function inject(bot: mineflayer.Bot) {
  await waitPluginLoads(bot, 'command');

  bot._isMonitorInput = false;
  bot.getInput = () => getInput(bot);

  bot.startMonitorInput = async () => {
    if (bot._isMonitorInput) return;
    bot._isMonitorInput = true;

    while (true) {
      if (!bot._isMonitorInput) break;
      const input = await bot.getInput();
      bot.tryExecute(input);
    }
  };

  bot.stopMonitorInput = () => {
    bot._isMonitorInput = false;
  };
  
  pluginReady(bot, 'helper');
}

declare module 'mineflayer' {
  interface Bot {
    _isMonitorInput: boolean;
    startMonitorInput(): void;
    stopMonitorInput(): void;
    getInput(): Promise<string>;
  }
}
