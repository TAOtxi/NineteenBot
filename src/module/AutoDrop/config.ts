interface Config {
    // enabled: boolean,      // 为了确保安全，每次进入游戏，需要手动开启，且不能持久化存储这个值
    ignoreSlots: number[],
    dropDirection: 'up' | 'down' | 'west' | 'east' | 'south' | 'north' | 'look',
    checkInterval: number,
    items: Item[],
    dropMode: 'whitelist' | 'blacklist',
}

interface Item {
    name: string, // string or regex pattern (e.g. '/^Golden Apple$/')
    id: string,   // https://zh.minecraft.wiki/w/Java版数据值#物品
    tags?: string[],
    enchants?: { name: string; lvl: number }[], // https://zh.minecraft.wiki/w/Java版数据值#魔咒
    minEntCounts?: number,
}

export { type Config, type Item };