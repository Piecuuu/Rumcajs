import { Infraction } from "@prisma/client"
import { ChannelType, User as DUser, EmbedBuilder, TextChannel } from "discord.js"
import { EventEmitter } from "node:events"
import { Bot } from "../bot.js"
import { logger } from "../config.js"
import { Database } from "../db.js"
import { NeutralEmbed } from "../misc/embeds.js"
import { Format } from "../misc/format.js"
import { InfractionType } from "../types.js"
import { Translation } from "./lang.js"
import { Common } from "../misc/common.js"
import { User } from "../api/routes/user.js"
import { Logger } from "../logger.js"

class InfractionEmbed extends NeutralEmbed {
  constructor(guildId?: string) {
    super(guildId);
  }

  async init(user: DUser, moderator: DUser, infraction: Infraction): Promise<this> {
    this.setFields([
      {
        name: await (await this.translation).get("infraction.neutral.embed.fields.user"),
        value: `<@${user.id}>`,
        inline: true
      },
      {
        name: await (await this.translation).get("infraction.neutral.embed.fields.moderator"),
        value: `<@${moderator.id}>`,
        inline: true
      },
    ])

    this.setThumbnail(user.avatarURL({
      forceStatic: false,
      extension: "webp",
      size: 1024
    }))

    this.setFooter({
      text: infraction.id
    })

    if(infraction.reason) this.addFields({
      name: await (await this.translation).get("infraction.neutral.embed.fields.reason"),
      value: `\`${infraction.reason}\``,
      inline: false
    })

    return this
  }
}

export const infractionEmitter = new EventEmitter()

infractionEmitter.on("send", async (infraction: Infraction) => {
  await User.createUserIfDoesntExist(infraction.author)
  await User.createUserIfDoesntExist(infraction.user)

  await User.addPoints(infraction.author, infractionToPoints[infraction.type])

  let guild = await Database.Db.guild.findUnique({
    where: {
      guildid: infraction.guild
    },
    select: {
      alertChannel: true
    }
  })

  if(!guild?.alertChannel) return;
  let channel: TextChannel;
  try {
    const ch = await Bot.Client.channels.fetch(guild.alertChannel)
    if(ch?.type != ChannelType.GuildText) return;
    channel = ch
  } catch(err) {
    logger.error(err)
    return
  }

  sendToChannel(channel, infraction);
  //logger.debug(JSON.stringify(infraction, null, 2))
})

const sendToChannel = async (channel: TextChannel, infraction: Infraction) => {
  const user = await Bot.Client.users.fetch(infraction.user)
  const moderator = await Bot.Client.users.fetch(infraction.author)

  /* const baseEmbed = new NeutralEmbed()
    .setFields([
      {
        name: "User",
        value: `<@${user.id}>`,
        inline: true
      },
      {
        name: "Moderator",
        value: `<@${moderator.id}>`,
        inline: true
      },
    ])
    .setThumbnail(user.avatarURL({
      forceStatic: false,
      extension: "webp",
      size: 1024
    }))
    .setFooter({
      text: infraction.id
    })

  if(infraction.reason) baseEmbed.addFields({
    name: "Reason",
    value: `\`${infraction.reason}\``,
    inline: false
  }) */
  //! dupa Mervexia uwu kawaii onii-chan
  let modEmbed: EmbedBuilder;
  if(infraction.type == InfractionType.Warn) {
    const e = (await new InfractionEmbed(channel.guild.id).init(user, moderator, infraction))
    e.setAuthor({
      name: await (await e.translation).get("infraction.neutral.embed.title.member-warned")
    })
    modEmbed = e
  }
  else if(infraction.type == InfractionType.Mute) {
    const e = (await new InfractionEmbed(channel.guild.id).init(user, moderator, infraction))
    e.setAuthor({
      name: await (await e.translation).get("infraction.neutral.embed.title.member-muted")
    })
    modEmbed = e
  }
  else if(infraction.type == InfractionType.Ban) {
    const e = (await new InfractionEmbed(channel.guild.id).init(user, moderator, infraction))
    e.setAuthor({
      name: await (await e.translation).get("infraction.neutral.embed.title.member-banned")
    })
    modEmbed = e
  }
  else if(infraction.type == InfractionType.Kick) {
    const e = (await new InfractionEmbed(channel.guild.id).init(user, moderator, infraction))
    e.setAuthor({
      name: await (await e.translation).get("infraction.neutral.embed.title.member-kicked")
    })
    modEmbed = e
  } else {
    modEmbed = (await new InfractionEmbed(channel.guild.id).init(user, moderator, infraction))
  }

  if(infraction.timeuntil) {
    modEmbed.addFields([
      {
        name: "Time",
        value: Format.secondsToHms(infraction.timeuntil)
      }
    ])
  }

  try {
    if(!modEmbed!) {
      return await channel.send({
        content: await ((await (new Translation()).init((await Translation.getGuildLangCode(channel.guild?.id!)))).get("error.unknown-error"))
      })
    }
    return await channel.send({
      embeds: [modEmbed]
    })
  } catch(err) {
    logger.error(err)
    return
  }
}

enum infractionToPoints {
  "warn" = 2,
  "other" = 1,
  "ban" = 5,
  "kick" = 4,
  "mute" = 3
}
