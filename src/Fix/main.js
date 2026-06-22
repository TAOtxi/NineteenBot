import fs from "fs";

const basePath = './src/Fix/Files/'

const map = [
  /**
   * Bug: 无法进入需要下载资源包的1.21+版本的服务器
   * Fix: see: https://github.com/PrismarineJS/mineflayer/pull/3842/commits
   */
  ['plugins/resource_pack.js', './node_modules/mineflayer/lib/plugins/resource_pack.js'],

  /**
   * @desc: 扩展 look2 方法
   * @see: https://github.com/PrismarineJS/mineflayer/pull/3901
   */
  ['plugins/physics.js', './node_modules/mineflayer/lib/plugins/physics.js'],

  /**
   * @desc: 优化寻找方法
   */
  ['plugins/blocks.js', './node_modules/mineflayer/lib/plugins/blocks.js'],

  /**
   * @desc: 修复重生问题
   * @see: https://github.com/PrismarineJS/mineflayer/issues/3905
   */
  ['plugins/health.js', './node_modules/mineflayer/lib/plugins/health.js'],

  /**
   * @desc: look2 的ts类型，修复 Anvil 类型
   */
  ['index.d.ts', './node_modules/mineflayer/index.d.ts'],

  /**
   * @desc: enchant for 1.20.5+
   * @see: https://github.com/PrismarineJS/prismarine-item/pull/176
   */
  ['prismarine-item/index.js', './node_modules/prismarine-item/index.js'],

  /**
   * Error: 报错 array size is abnormally large，来自识别失败的的数据包引起
   * Fix: 修改 node_modules/protodef/src/datatypes/compiler-structures.js:13
   *      跳过其抛出的错误，修改代码如下
   * ```js
   * // code += 'if (count > 0xffffff && !ctx.noArraySizeCheck) throw new Error("array size is abnormally large, not reading: " + count)\n'
   *    code += 'if (count > 0xffffff && !ctx.noArraySizeCheck) { console.warn("[Protodef] Abnormally large array size ignored:", count); return { value: [], size: countSize } }\n'
   * ```
   */
  ['./protodef/compiler-structures.js', './node_modules/protodef/src/datatypes/compiler-structures.js'],

  /**
   * fix: 忽略没有签名的信息
   */
  ['minecraft-protocol/chat.js', 'node_modules/minecraft-protocol/src/client/chat.js'],
]


for (const [src, dst] of map) {
  const code = fs.readFileSync(basePath + src, 'utf-8');
  fs.writeFileSync(dst, code);

  console.log(`Update ${src}`);
}