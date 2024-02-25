import { Guild } from 'discord.js';
import * as fs from 'fs/promises';
import path from "path";
import yaml from 'yaml';
import { Bot } from '../bot.js';
import { logger } from '../config.js';
import { Database } from '../db.js';
import { Logger } from '../logger.js';

export type TranslationMap = Record<string, string>;

export class Translation {
  private static languageMap: Record<string, TranslationMap> = {};
  public static guildLanguageCache: Record<string, string> = {};

  private translations: TranslationMap | undefined;
  private languageCode: string

  constructor() {
    /* if(true) {
      const l = Promise.resolve(languageCode)
      console.log(l)
      l.then((lc) => {
        logger.verbose(lc)
        this.languageCode = lc
        if (!Translation.languageMap[lc]) {
          const filePath = `./lang/${languageCode}.yml`;
          Translation.languageMap[lc] = fs
            .readFile(filePath, 'utf8')
            .then((fileContents) => yaml.parse(fileContents));
        }

        Translation.languageMap[lc].then((translationMap) => {
          this.translations = translationMap;
        });
      })
      return
    } */

    /* this.languageCode = languageCode
    if (!Translation.languageMap[languageCode]) {
      const filePath = `./lang/${languageCode}.yml`;
      Translation.languageMap[languageCode] = fs
        .readFile(filePath, 'utf8')
        .then((fileContents) => yaml.parse(fileContents));
    }

    Translation.languageMap[languageCode].then((translationMap) => {
      this.translations = translationMap;
    }); */
    Logger.Logger.verbose(`Constructor called for ${Translation.name}`)
  }

  async init(languageCode: string | Promise<string>) {
    const langPromise = Promise.resolve(languageCode)
    const lc = await langPromise
    this.languageCode = lc

    logger.verbose(lc)
    if (!Translation.languageMap[lc]) {
      const filePath = `./lang/${lc}.yml`;
      Translation.languageMap[lc] = await fs
        .readFile(filePath, 'utf8')
        .then((fileContents) => yaml.parse(fileContents));
      Logger.Logger.verbose(`Loaded '${path.resolve(filePath)}' lc '${lc}'`)
    }

    Logger.Logger.verbose(`Skipped loading lc '${lc}'`)

    this.translations = Translation.languageMap[lc]
    return this
  }

  async get(key: string): Promise<string> {
    if (!this.translations) {
      const filePath = `./lang/${this.languageCode}.yml`;
      const fc = await fs.readFile(filePath, 'utf8')
      this.translations = yaml.parse(fc)
      Logger.Logger.verbose(`Loaded '${path.resolve(filePath)}' for '${key}'`)
      return this.translations?.[key] || key.toString();
    }
    Logger.Logger.verbose(`Skipped loading for '${key}'`)
    return this.translations?.[key] || key.toString()
  }

  static async getGuildLangCode(guildId: string) {
    if (Translation.guildLanguageCache[guildId]) {
      return Translation.guildLanguageCache[guildId];
    }

    const guild = await Database.Db.guild.findUnique({
      where: {
        guildid: guildId
      },
      select: {
        preferedLang: true
      }
    })
    const dguildpromise = Bot.Client.guilds.fetch(guildId).catch(() => {})
    if(!(await dguildpromise instanceof Guild)) return "en_US"
    const dguild = await dguildpromise as Guild

    const languageCode = guild?.preferedLang ?? "en_US"
    Translation.guildLanguageCache[guildId] = languageCode;

    return languageCode;
  }

  /**
   * @deprecated Probably doesn't work, don't use
   * @param code Language code
   * @returns Region code
   */
  static convertLanguageRegionCode(code: string): string {
    if (code.includes('_')) return code;
    if (code.includes('-')) return code.replace("-", "_");

    const langCode = code.toLowerCase().replace(/^\w/, c => c.toUpperCase());
    try {
      const regionCode = new Intl.DateTimeFormat(langCode).resolvedOptions().locale.split('-')[1];
      return `${langCode}_${regionCode.toUpperCase()}`;
    } catch (error) {
      return langCode;
    }
  }
}

export enum LanguageFlags {
  "🇵🇱" = "pl_PL",
  "🇺🇸" = "en_US",
  "🇦🇺" = "en_US",
  "🇬🇧" = "en_US",
  "🇨🇦" = "en_US",
  "🇺🇦" = "ru_UA",
  "🇻🇦" = "la_VA",
}
