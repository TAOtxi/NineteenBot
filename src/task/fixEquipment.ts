import mineflayer from 'mineflayer';
import { type Config as AutoDropConfig } from '@/plugins/autodrop.js';
import prisItem from 'prismarine-item';

const autoDropConfig: AutoDropConfig = {
  ignoreSlots: [],
  useDropRotation: false,
  dropRotation: {
    yaw: 0,
    pitch: 0,
  },
  dropDirection: "east",
  triggerInterval: 20 * 10,
  dropMode: "whitelist",
  triggerMinNotEmptySlots: 0,
  triggerByTime: true,
  triggerByItem: false,
  triggerItemId: "*",
  items: [
    {
      id: "/_sword$/",
      enchants: [
        {
          name: "unbreaking",
          lvl: 5
        }
      ]
    },
    {
      id: "/^netherite_/",
      durability: -2
    },
    {
      id: "fishing_rod"
    },
    {
      id: "enchanted_book",
      enchants: [
        {
          name: "mending",
          lvl: 1
        }
      ]
    },
  ]
}

export default function (bot: mineflayer.Bot) {
  bot.once('spawn', () => {
    bot.chat('/stp industry');
    
    bot.createOnceTimeTask('waitFor10Seconds', async () => {
      let isEquip = false;

      const check = (item: prisItem.Item | null | undefined) => {
        return item?.name.match(/_sword$/) && 
          item.enchants?.some(enchant => enchant.name === 'smite' && enchant.lvl >= 5)
      }

      if (check(bot.heldItem)) {
        isEquip = true;
      }

      for (let i=bot.inventory.inventoryStart; i<bot.inventory.inventoryEnd + 1; i++) {
        if (isEquip) break;

        const item = bot.inventory.slots[i];
        if (check(item)) {
          await bot.equip(item!, 'hand');
          isEquip = true;
          break;
        }
      }
      bot.chat('/home ender_man');
      if (!isEquip) {
        bot.baseWarn(bot.identifier, '[fixEquipment] No sword item found !', true);
        return;
      }

      // TODO: 待寻找一种优雅的覆盖配置的方法
      bot.configMap['autodrop'] = autoDropConfig;
      const repairConfig = bot.configMap['autorepair'];
      repairConfig.mendingBookContainerPos = { x: -169, y: 1, z: 13272 };
      repairConfig.equipmentContainerPos = { x: -170, y: 1, z: 13272 };
      repairConfig.canGetEquipmentFromContainer = true;

      bot.startAutoReplace();
      bot.startAutoAttack();
      bot.startAutoRepair();
      bot.enableAutoDrop();
      
    }, 20 * 10)
  })
}