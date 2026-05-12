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


export default {
  isReg,
  handleRegMatch,
  regMatchOrEqual,
  stringToList,
}