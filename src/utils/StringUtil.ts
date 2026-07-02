function isReg(str: string) {
  return str.startsWith('/') && str.endsWith('/');
}

function handleRegMatch(pattern: string, content: string) {
  if (!isReg(pattern)) {
    throw new Error("Invalid regex pattern.");
  }
  const reg = new RegExp(pattern.slice(1, -1));
  return reg.test(content);
}

function regMatchOrEqual(pattern: string, content: string) {
  if (isReg(pattern)) {
    return handleRegMatch(pattern, content);
  }
  return pattern === content;
}

function stringToList(str: string, sep: string = ',', mapper: (item: string) => any = item => item) {
  return str.split(sep).map(mapper);
}

function parsePos(str: string, pattern: RegExp, mapper: (item: string) => number = Number) {
  const result: number[] = [];
  const matcher = str.matchAll(pattern);
  let index = 0;
  for (const match of matcher) {
    if (!match[1]) {
      throw new Error(`Invalid position format ${str}`);
    }
    result[index++] = mapper(match[1]);
  }
  return result;
}

function parseIntPos(str: string) {
  const pattern = /(?:,\s*)?(-?\d+)/g;
  return parsePos(str, pattern, parseInt);
}

function parseFloatPos(str: string) {
  const pattern = /(?:,\s*)?(-?\d+(?:\.\d+)?)/g;
  return parsePos(str, pattern, parseFloat);
}


export default {
  isReg,
  handleRegMatch,
  regMatchOrEqual,
  stringToList,
  parseIntPos,
  parseFloatPos,
}