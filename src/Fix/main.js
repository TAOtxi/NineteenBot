import mineflayer from 'mineflayer';
import fs from "fs";

/**
 * Error: 无法连接 Velocity 端的子服务器
 * Fix: See: https://github.com/PrismarineJS/mineflayer/pull/3834/commits
 */
// function fixVelocity(bot: mineflayer.Bot) {
//   bot.on("spawn", () => {
//     // bot.physicsEnabled = true
//   });
// }

function fixVelocity() {
  const code1 = fs.readFileSync("./src/Fix/VelocityFix/physics.js").toString();
  const oldCodePath = "./node_modules/mineflayer/lib/plugins/physics.js";
  handleFile(oldCodePath) && fs.writeFileSync(oldCodePath, code1);

  const code2 = fs.readFileSync("./src/Fix/VelocityFix/velocity.js").toString();
  const oldCodePath2 = "./node_modules/mineflayer/lib/plugins/velocity.js";
  fs.writeFileSync(oldCodePath2, code2);

  const oldCodePath3 = "./node_modules/mineflayer/lib/loader.js";
  const code3 = fs.readFileSync(oldCodePath3).toString();
  handleFile(oldCodePath3) && fs.writeFileSync(oldCodePath3, 
    code3.replace("kick: require('./plugins/kick'),", 
                  "kick: require('./plugins/kick'),\n  velocity: require('./plugins/velocity'),"));
}




/**
 * Bug: 无法进入需要下载资源包的1.21+版本的服务器
 * Fix: see: https://github.com/PrismarineJS/mineflayer/pull/3842/commits
 */
function fixResourcePack() {
  const code = fs.readFileSync("./src/Fix/ResourcePackFix/resource_pack.js").toString();
  const oldCodePath = "./node_modules/mineflayer/lib/plugins/resource_pack.js";
  handleFile(oldCodePath) && fs.writeFileSync(oldCodePath, code);
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
  const code = fs.readFileSync(filePath).toString();
  const fixedCode = code.replace(
    /if \(count > 0xffffff && !ctx\.noArraySizeCheck\) throw new Error\("array size is abnormally large, not reading: " \+ count\)\\n/,
    'if (count > 0xffffff && !ctx.noArraySizeCheck) { console.warn("[Protodef] Abnormally large array size ignored:", count); return { value: [], size: countSize } }\\n'
  );
  handleFile(filePath) && fs.writeFileSync(filePath, fixedCode);
}

/**
 * Bug: bot.fish() 钓鱼会自动转向 See: https://github.com/PrismarineJS/mineflayer/issues/3537
 */
function fixFishing() {
  const code = fs.readFileSync("./src/Fix/FishingFix/inventory.js").toString();
  const oldPath = "./node_modules/mineflayer/lib/plugins/inventory.js";
  handleFile(oldPath) && fs.writeFileSync(oldPath, code);
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


function handleFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`File ${filePath} not found.`);
    return false;
  }
  console.log(`Backup ${filePath}`);
  const backupPath = filePath + Date.now() + ".backup";
  fs.copyFileSync(filePath, backupPath);
  return true;
}


/***************** Fix code ***************** */
export default {
  fix() {
    fixVelocity();
    fixResourcePack();
    fixFishing();
  },
  fixError1,
}

/* ********************** 手动修复 ********************** */
fixVelocity();
fixFishing();
