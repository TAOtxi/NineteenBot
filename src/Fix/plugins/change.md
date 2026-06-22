<!-- `node_modules/mineflayer/lib/plugins/inventory.js:413:414`
```js
// 注释掉
// bot.currentWindow = null
// bot.emit('windowClose', window)
``` -->

`node_modules\mineflayer\lib\plugins\blocks.js`
```js
// insert:160
const maxDistance2 = maxDistance * maxDistance

// replace:186
if (fullMatcher(cursor) && cursor.distanceSquared(point) <= maxDistance2) blocks.push(cursor.clone())
```
