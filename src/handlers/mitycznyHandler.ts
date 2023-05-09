import { PermissionFlagsBits } from "discord.js";
import { Bot } from "../bot.js";
import { logger } from "../config.js";
import { Database } from "../db.js";
import { PermissionsCheck } from "../misc/permcheck.js";

export class MitycznyHandler {
  static async start(guildid: string) {
/*     const guild = await Database.Db.guild.findUnique({
      where: {
        guildid: guildid
      },
      select: {
        specialRole: true
      }
    })
    if(!guild) return
    const mitid = await guild?.specialRole
    if(!mitid) return */

    const guild = await Database.Db.guild.findUnique({
      where: {
        guildid: guildid
      },
      select: {
        specialRole: true
      }
    })
    if(!guild || !guild?.specialRole) return

    logger.debug(`Started updating special role on '${guildid}'`)

/*     const rola = (await (await Bot.Client.guilds.fetch(guildid)).roles.fetch(mitid)) */

    setInterval(async () => {
      const guild = await Database.Db.guild.findUnique({
        where: {
          guildid: guildid
        },
        select: {
          specialRole: true
        }
      })
      if(!guild) return
      const mitid = await guild?.specialRole
      if(!mitid) return
      const rola = (await (await Bot.Client.guilds.fetch(guildid)).roles.fetch(mitid))
      if(!rola?.editable || !await PermissionsCheck.isHavingPermission(await rola.guild.members.fetch(Bot.Client.user?.id!), PermissionFlagsBits.ManageRoles)) return

      const random = getRandomColor()
      logger.debug(`Updated role on '${guildid}' to ${random} - #${random.toString(16)}`);
      rola?.setColor(random, "Special role color update")
    }, 3600000)
  }
}

const getRandomColor = () => {
  /* const max = specialRoleColors.length
  const random = Math.floor(Math.random() * (max + 1))
  return specialRoleColors[random] */
  const red = Math.floor(Math.random() * 256)
  const green = Math.floor(Math.random() * 256)
  const blue = Math.floor(Math.random() * 256)
  return (red << 16) + (green << 8) + blue
}

//parseInt(crypto.createHmac("sha256", crypto.randomBytes(16)).digest("hex").slice(0, 10) + Date.now(), 16)
