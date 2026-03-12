import mineflayer from 'mineflayer';
import fs from "fs";

/**
 * Error: 无法连接 Velocity 端的子服务器
 * Fix: createBot添加上 `physicsEnabled: false` 属性，并使用以下代码
 * ```js 
 *  bot.on("spawn", () => {
 *    bot.physicsEnabled = true
 *  });
 * ```
 */
function fixVelocity(bot: mineflayer.Bot) {
  bot.on("spawn", () => {
    bot.physicsEnabled = true
  });
}



/**
 * Error: 报错 array size is abnormally large，来自识别失败的的数据包引起
 * Fix: 修改 node_modules/protodef/src/datatypes/compiler-structures.js:13
 *      跳过其抛出的错误，修改代码如下
 * ```js
 * // code += 'if (count > 0xffffff && !ctx.noArraySizeCheck) throw new Error("array size is abnormally large, not reading: " + count)\n'
 *    code += 'if (count > 0xffffff && !ctx.noArraySizeCheck) { console.warn("[Protodef] Abnormally large array size ignored:", count); return { value: [], size: countSize } }\n'
 * ```
 */
function fixError1() {
  const filePath = "./node_modules/protodef/src/datatypes/compiler-structures.js";
  if (!handleFile(filePath)) {
    return;
  }
  const code = fs.readFileSync(filePath).toString();
  const fixedCode = code.replace(
    /if \(count > 0xffffff && !ctx\.noArraySizeCheck\) throw new Error\("array size is abnormally large, not reading: " \+ count\)\\n/,
    'if (count > 0xffffff && !ctx.noArraySizeCheck) { console.warn("[Protodef] Abnormally large array size ignored:", count); return { value: [], size: countSize } }\\n'
  );
  fs.writeFileSync(filePath, fixedCode);
}


/**
 * @ignore
 * Bug: varint is too big
 * Fix: 修改 node_modules/protodef/src/datatypes/varint.js:27
 *      跳过其抛出的错误，修改代码如下
 * ```js
 * // if (shift > 64) throw new PartialReadError(`varint is too big: ${shift}`) // Make sure our shift don't overflow.
 *    if (shift > 64) {
 *      console.warn(`varint is too big: ${shift}`) // Make sure our shift don't overflow.
 *      return { value: 0, size: cursor - offset }
 *    }
 * ```
 */


function handleFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    console.warn(`File ${filePath} not found.`);
    return false;
  }
  const backupPath = filePath + ".backup";
  fs.copyFileSync(filePath, backupPath);
  return true;
}


/***************** Fix code ***************** */
export default {
  fix(bot: mineflayer.Bot) {
    fixVelocity(bot);
  },
  fixError1,
}
