function haveIntersection(arr1: string[], arr2: string[]) {
  const map = new Set(arr1);
  return arr2.some(item => map.has(item));
}


export default {
  haveIntersection,
}
