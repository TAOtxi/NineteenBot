interface Config {
    enabled: boolean,
    ignoreSlots: number[],
    dropDirection: 'up' | 'down' | 'west' | 'east' | 'south' | 'north' | 'look',
    checkInterval: number,
    items: Item[],
    dropMode: 'whiteList' | 'blackList',
}

interface Item {
    name: string,
    id: string,
    tags?: string[],
    enchants?: { name: string; lvl: number }[],
    minEntCounts?: number,
}

export { type Config, type Item };