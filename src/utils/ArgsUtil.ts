/**
 * @description 解析命令行参数，暂时是这样吧
 * input  -->  info entity -c 50 --type player --ascend --name TAOtxi
 * output -->  {'--type': 'player', '--ascend': '', '-c': '50', '--name': 'TAOtxi', 'cmd': 'entity'}
 * 
 * @param args
 * @returns 
 */
function parseArgs(args: string) {
  const argsMap: Record<string, string> = {};
  
  const argsList = args.split(' ').filter(arg => arg !== '');
  for (let i=0; i<argsList.length; i++) {
    const arg = argsList[i];
    if (!arg) continue;
    if (!arg.startsWith('--') && !arg.startsWith('-')) {
        argsMap['cmd'] = arg;
        continue;
    };

    const nextArg = argsList[i+1];
    if (!nextArg || nextArg.startsWith('--') || nextArg.startsWith('-')) {
        argsMap[arg] = '';
        continue;
    }
    argsMap[arg] = nextArg;
  }
  return argsMap;
}

export default {
    parseArgs,
}