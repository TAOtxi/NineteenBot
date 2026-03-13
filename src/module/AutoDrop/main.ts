import fs from 'fs';
import mineflayer from 'mineflayer';
import Logger from '../../utils/Logger.js';
import { type Config, type Item } from './config.js';
import prisItem from 'prismarine-item';


let bot: mineflayer.Bot;
let config: Config;
let tickCounter = 0;
const logger = new Logger('AutoDrop', false);

function loadConfig(path: string='./config/AutoDrop.json') {
    if (!fs.existsSync(path)) {
        throw new Error(`Config file not found: ${path}`);
    }

    const data = fs.readFileSync(path);
    config = JSON.parse(data.toString());
}

function tick() {
    tickCounter++;
    if (tickCounter % config.checkInterval !== 0) {
        return;
    }

    const l = bot.inventory.inventoryStart;
    const r = bot.inventory.inventoryEnd;
    for (let i = l; i <= r; i++) {
        const item = bot.inventory.slots[i];
        if (!item) {
            continue;
        }
        match(item) && handleDrop(i);
    }

}


function match(item: prisItem.Item) {
    for (const itemCheck of config.items){
        // TODO: 待寻找翻译方式
        // name <Golden Apple>
        if (itemCheck.name !== item.displayName && itemCheck.name !== '*') {
            return false;
        }
        // id <golden_apple>
        if (itemCheck.id !== item.name && itemCheck.id !== '*') {
            return false;
        }

        if (!itemCheck.enchants) {
            return true;
        }
        const itemEnts: Record<string, number> = item.enchants.reduce((acc, cur) => ({ ...acc, [cur.name]: cur.lvl }), {});
        let enchantCounts = 0;
        // enchantment
        for (const { name, lvl } of itemCheck.enchants) {
            if (itemEnts[name] !== undefined && itemEnts[name] >= lvl) {
                enchantCounts++;
            }
        }

        if (enchantCounts < (itemCheck.minEntCounts ?? item.enchants.length)) {
            return false;
        }
        return true;

    }
}

function handleDrop(slot: number) {
    if (config.dropDirection === 'look') {
        dropItemAll(slot);
        return;
    }
    const botYaw = bot.entity.yaw;
    const botPitch = bot.entity.pitch;

    const { yaw, pitch } = getDropAngle(config.dropDirection);
    bot.look(yaw, pitch, true);
    dropItemAll(slot);
    bot.look(botYaw, botPitch, true);  // trun back
}

function dropItemAll(slot: number) {
    bot.inventory.dropClick({
        mode: 4,
        mouseButton: 1,
        slot,
    });
}

function getDropAngle(dirction: Config['dropDirection']) {
    switch (dirction) {
        case 'down':
            return { yaw: 0, pitch: -90 };
        case 'up':
            return { yaw: 0, pitch: 90 };
        case 'west':
            return { yaw: 180, pitch: 0 };
        case 'south':
            return { yaw: -90, pitch: 0 };
        case 'east':
            return { yaw: 0, pitch: 0 };
        case 'north':
            return { yaw: 90, pitch: 0 };
        case 'look':
        default:
            return { yaw: bot.entity.yaw, pitch: bot.entity.pitch };
    }
}

function init(newBot: mineflayer.Bot, logToFile: boolean=false) {
    bot = newBot;
    logger.setLogToFile(logToFile);

    if (!config) {
        loadConfig();
    }
}


export default {
    tick,
    init
}