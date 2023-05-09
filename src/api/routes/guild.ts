import { Request, Response } from "express";
import { Database } from "../../db.js";
import Route from "../decorator.js";
import { ErrorModel } from "../models.js";
import { ObjectId } from "bson";
import { Translation } from "../../handlers/lang.js";

export class APIGuild {
  @Route({
    method: "get",
    path: "/guild",
  })
  async getGuild(req: Request, res: Response) {
    if(!req.query.guildid) return res.status(400).json({code: 0, message: "No guildid"} as ErrorModel)
    const guild = await Database.Db.guild.findUnique({
      where: {
        guildid: req.query.guildid as string
      }
    }).catch(() => {
      res.status(500).json(null)
    })
    res.status(200).json(guild)
  }

  static async createGuild(guildId: string) {
    return await Database.Db.guild.create({
      data: {
        guildid: guildId,
        adminRoles: [],
        id: new ObjectId().toString()
      }
    }).catch(() => {})
  }

  static async setLanguage(guildId: string, code: string) {
    if(Translation.guildLanguageCache[guildId]) {
      delete Translation.guildLanguageCache[guildId]
    }
    if(await Database.Db.guild.count({
      where: {
        guildid: guildId
      }
    }) == 0) {
      await Database.Db.guild.create({
        data: {
          guildid: guildId,
          id: new ObjectId().toString(),
          preferedLang: code
        }
      }).catch(() => {
        throw new Error()
      })
      return
    }

    await Database.Db.guild.update({
      where: {
        guildid: guildId
      },
      data: {
        preferedLang: code
      }
    }).catch(() => {
      throw new Error()
    })
  }
}
