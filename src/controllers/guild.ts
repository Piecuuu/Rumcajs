import { dbSettings } from "../config.js"
import { Database } from "../db.js"
import { DBGuild } from "../db/connector.js"
import { RumcajsId } from "../misc/id.js"
import { Model } from "./model.js"

export class Guild extends Model {
  static async add(guild: DBGuild) {
    switch(dbSettings.provider) {
      case "postgresql":
      case "mongodb":
        return await Database.Db.guild.create({
          data: {
            ...guild,
            adminRoles: [],
            id: RumcajsId.generateId()
          }
        })
        break

      case "mysql":
      case "sqlite":
        return await Database.Db.guild.create({
          data: {
            ...guild,
            adminRoles: "",
            id: RumcajsId.generateId()
          }
        } as any)
        break
    }
  }

  async fetch() {
    const g = await Database.Db.guild.findUnique({
      where: {
        id: this.id
      }
    })

    return g
  }

  static async getByData(data: DBGuild) {
    const g = await Database.Db.guild.findUnique({
      where: data
    })

    return g
  }

  async update(data: DBGuild) {
    const g = await Database.Db.guild.update({
      where: {
        id: this.id
      },
      data: data
    })

    return g
  }

  async remove() {
    await Database.Db.guild.delete({
      where: {
        id: this.id
      }
    })

    this.destroy();
  }

  async count(data: DBGuild) {
    return await Database.Db.guild.count({
      where: data
    })
  }
}
