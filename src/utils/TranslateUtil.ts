import fs from "fs";
import CmdUtil from "./CmdParser.js";

const defaultLangDir = './resources/lang';
const fallbackLang = 'en_us';
const defaultLang = CmdUtil.getValueByArgName(process.argv, 'lang') || fallbackLang;
let langData: Record<string, Record<string, string>> = {};

// TODO: 改成插件
// TODO: 翻译文件使用minecraft-data库
function loadLangData(lang: string = defaultLang, langDir: string = defaultLangDir) {
  if (langData[lang]) {
    return;
  }

  let langFilePath: string = `${langDir}/${lang}.json`;
  if (!fs.existsSync(langFilePath)) {
    console.error(`Language file ${langFilePath} does not exist`);
    if (lang !== fallbackLang) {
      console.info(`Falling back to default language ${fallbackLang}`);
      loadLangData(fallbackLang, defaultLangDir);
    }
    return;
  }

  try {
    const data = fs.readFileSync(langFilePath, 'utf8');
    langData[lang] = JSON.parse(data);
  } catch (err) {
    console.error(`Error loading language file ${langFilePath}: ${err}`);
  }
}

loadLangData(defaultLang);

/**
 * 常用的翻译 key 类型：
 * "block.minecraft.acacia_door": "金合欢木门",
 * "item.minecraft.apple": "苹果",
 * "entity.minecraft.wolf": "狼",
 */

const itemKeyPrefix = 'item.minecraft.';
const entityKeyPrefix = 'entity.minecraft.';
const blockKeyPrefix = 'block.minecraft.';
const enchantKeyPrefix = 'enchantment.minecraft.';

export default class TranslateUtil {
  static t(key: string, lang: string = defaultLang) {
    loadLangData(lang);
    
    const translation = langData[lang]?.[key];
    if (translation === undefined) {
      loadLangData(fallbackLang);
      const fallbackTranslation = langData[fallbackLang]?.[key];
      return fallbackTranslation ?? key;
    }
    return translation;
  }

  static translate(key: string, lang: string = defaultLang) {
    return TranslateUtil.item(key, lang) ?? 
          TranslateUtil.block(key, lang) ?? 
          TranslateUtil.entity(key, lang) ?? key;
  }

  static item(key: string, lang: string = defaultLang) {
    return this.tryTranslate(itemKeyPrefix + key, lang) ?? null;
  }

  static entity(key: string, lang: string = defaultLang) {
    return this.tryTranslate(entityKeyPrefix + key, lang) ?? null;
  }

  static block(key: string, lang: string = defaultLang) {
    return this.tryTranslate(blockKeyPrefix + key, lang) ?? null;
  }

  static enchant(key: string, lang: string = defaultLang) {
    return this.tryTranslate(enchantKeyPrefix + key, lang) ?? null;
  }

  static tryTranslate(key: string, lang: string = defaultLang) {
    return langData[lang]?.[key] ?? null;
  }

  static hasLang(lang: string) {
    return langData[lang] !== undefined;
  }
}
