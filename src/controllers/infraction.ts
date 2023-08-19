import { GuildMember } from "discord.js"
import { infractionEmitter } from "../handlers/infractionHandler.js"
import { DBInfraction } from "../db/connector.js"
import { Database } from "../db.js"
import { Bot } from "../bot.js"
import { NeutralEmbed } from "../misc/embeds.js"
import { Model } from "./model.js"

export class Infraction extends Model {
  constructor(id: string) {
    super(id)
  }

  static async add(infraction: DBInfraction) {
    const guild = await Bot.Client.guilds.fetch(infraction.guild)
    const user = await guild.members.fetch(infraction.user).catch(() => {})
    if(!(user instanceof GuildMember)) return null
    return await Database.Db.infraction.create({
      data: infraction
    }).then(async () => {
      const dmembed = new NeutralEmbed(infraction?.guild)
      dmembed.setDescription((await (await dmembed.translation).get("dm." + infraction.type))
        .replace("{SERVERNAME}", guild?.name!)
        + (infraction.reason ? (await (await dmembed.translation).get("common.dm.for-reason"))
          .replace("{REASON}", infraction.reason) : ""))

      infractionEmitter.emit("send", infraction)
      await user.send({
        embeds: [dmembed]
      }).catch(() => {})
    })
  }

  async fetch() {
    const infraction = await Database.Db.infraction.findUnique({
      where: {
        id: this.id
      }
    })

    return infraction
  }

  static async getByData(data: DBInfraction) {
    const infraction = await Database.Db.infraction.findUnique({
      where: data
    })

    return infraction
  }

  async update(data: DBInfraction) {
    const infraction = await Database.Db.infraction.update({
      where: {
        id: this.id
      },
      data: data
    })

    return infraction
  }

  async remove() {
    await Database.Db.infraction.update({
      where: {
        id: this.id
      },
      data: {
        deleted: true
      }
    })

    this.destroy();
  }

  async hardRemove() {
    await Database.Db.infraction.delete({
      where: {
        id: this.id
      }
    })

    this.destroy();
  }
}
