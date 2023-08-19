import { AutoModerationAction, AutoModerationActionType } from "discord.js";
import { ArgsOf, Discord, On } from "discordx";
import { Bot } from "../bot.js";
import { Database } from "../db.js";
import { Infraction } from "../controllers/infraction.js";
import { InfractionType } from "../types.js";
import { RumcajsId } from "../misc/id.js";

@Discord()
class Automod {
  @On({
    event: "autoModerationActionExecution"
  })
  async automod (
    [execution]: ArgsOf<"autoModerationActionExecution">
  ) {
    let canMute = true
    const rule = (execution.autoModerationRule ?? await execution.guild.autoModerationRules.fetch(execution.ruleId))
    if(execution.action.type != AutoModerationActionType.BlockMessage) return
    let timeoutaction: AutoModerationAction | null = null
    for (const action of rule.actions) {
      if(action.type == AutoModerationActionType.Timeout) {
        canMute = false
        timeoutaction = action
      }
    }

    const infcount = await Database.Db.infraction.count({
      where: {
        user: execution.user?.id,
        guild: execution.guild.id,
        OR: [
          {
            deleted: {
              equals: false
            }
          },
          {
            deleted: {
              equals: null
            }
          }
        ]
      }
    })

    const reason = "Automod rule violation"
    switch(infcount) {
      case 0:
      case 1: {
        await Infraction.add({
          author: Bot.Client.user?.id!,
          creationdate: new Date(),
          deleted: null,
          guild: execution.guild.id,
          reason: reason,
          timeuntil: null,
          type: InfractionType.Warn,
          user: execution.userId,
          id: RumcajsId.generateId()
        }/* , execution.member ?? await execution.guild.members.fetch(execution.userId), execution.guild */).catch(() => {})

        break
      }

      case 2: {
        const time = 600
        const timems = time * 1000

        await Infraction.add(canMute ? {
          author: Bot.Client.user?.id!,
          creationdate: new Date(),
          deleted: null,
          guild: execution.guild.id,
          reason: reason,
          timeuntil: time,
          type: InfractionType.Mute,
          user: execution.userId,
          id: RumcajsId.generateId()
        } : {
          author: Bot.Client.user?.id!,
          creationdate: new Date(),
          deleted: null,
          guild: execution.guild.id,
          reason: reason,
          timeuntil: timeoutaction?.metadata.durationSeconds ?? 60,
          type: InfractionType.Mute,
          user: execution.userId,
          id: RumcajsId.generateId()
        }/* , execution.member ?? await execution.guild.members.fetch(execution.userId), execution.guild */).catch(() => {})

        if(canMute) await execution.member?.timeout(timems, reason).catch(() => {})

        break
      }

      case 3:
      case 4: {
        const time = 900
        const timems = time * 1000

        await Infraction.add(canMute ? {
          author: Bot.Client.user?.id!,
          creationdate: new Date(),
          deleted: null,
          guild: execution.guild.id,
          reason: reason,
          timeuntil: time,
          type: InfractionType.Mute,
          user: execution.userId,
          id: RumcajsId.generateId()
        } : {
          author: Bot.Client.user?.id!,
          creationdate: new Date(),
          deleted: null,
          guild: execution.guild.id,
          reason: reason,
          timeuntil: timeoutaction?.metadata.durationSeconds ?? 60,
          type: InfractionType.Mute,
          user: execution.userId,
          id: RumcajsId.generateId()
        }/* , execution.member ?? await execution.guild.members.fetch(execution.userId), execution.guild */).catch(() => {})

        if(canMute) await execution.member?.timeout(timems, reason).catch(() => {})

        break
      }

      case 5: {
        const time = 1500
        const timems = time * 1000

        await Infraction.add(canMute ? {
          author: Bot.Client.user?.id!,
          creationdate: new Date(),
          deleted: null,
          guild: execution.guild.id,
          reason: reason,
          timeuntil: time,
          type: InfractionType.Mute,
          user: execution.userId,
          id: RumcajsId.generateId()
        } : {
          author: Bot.Client.user?.id!,
          creationdate: new Date(),
          deleted: null,
          guild: execution.guild.id,
          reason: reason,
          timeuntil: timeoutaction?.metadata.durationSeconds ?? 60,
          type: InfractionType.Mute,
          user: execution.userId,
          id: RumcajsId.generateId()
        }/* , execution.member ?? await execution.guild.members.fetch(execution.userId), execution.guild */).catch(() => {})

        if(canMute) await execution.member?.timeout(timems, reason).catch(() => {})

        break
      }

      default: {
        let time = infcount * 60 * 15
        let timems = time * 1000
        const maxtime = 2332800

        if(time > maxtime || timems > maxtime * 1000) {
          time = maxtime
          timems = time * 1000
        }

        await Infraction.add(canMute ? {
          author: Bot.Client.user?.id!,
          creationdate: new Date(),
          deleted: null,
          guild: execution.guild.id,
          reason: reason,
          timeuntil: time,
          type: InfractionType.Mute,
          user: execution.userId,
          id: RumcajsId.generateId()
        } : {
          author: Bot.Client.user?.id!,
          creationdate: new Date(),
          deleted: null,
          guild: execution.guild.id,
          reason: reason,
          timeuntil: timeoutaction?.metadata.durationSeconds ?? 60,
          type: InfractionType.Mute,
          user: execution.userId,
          id: RumcajsId.generateId()
        }/* , execution.member ?? await execution.guild.members.fetch(execution.userId), execution.guild */).catch(() => {})

        if(canMute) await execution.member?.timeout(timems, reason).catch(() => {})

        break
      }
    }
  }
}
