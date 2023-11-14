import { ApplicationCommandOptionType, ChatInputCommandInteraction, EmbedBuilder, User } from "discord.js";
import { Discord, Guard, Slash, SlashGroup, SlashOption } from "discordx";
import { Pagination } from "pagination.djs";
import { User as User1 } from "../api/routes/user.js";
import { dbSettings } from "../config.js";
import { Database } from "../db.js";
import { DBInfraction, DBInfractionAppeal } from "../db/connector.js";
import { GuildExists } from "../guards/GuildExists.js";
import { NotAdmin } from "../guards/NotAdmin.js";
import { InfractionToPoints } from "../handlers/infractionHandler.js";
import { ErrorEmbed, NeutralEmbed, SuccessEmbed } from "../misc/embeds.js";
import { Format } from "../misc/format.js";
import { RumcajsId } from "../misc/id.js";
import { UserActions } from "../types.js";

@Discord()
@SlashGroup({ description: "Commands related to infractions.", name: "infraction" })
class Infractions {
  @Slash({
    name: "list",
    description: "Lists all the user's infractions."
  })
  @SlashGroup("infraction")
  @Guard(NotAdmin)
  async infractions(
    @SlashOption({
      name: "member",
      description: "Member",
      type: ApplicationCommandOptionType.User,
      required: true
    })
    u: User,
    interaction: ChatInputCommandInteraction
  ) {
    let user = u
    /* if(!u) user = interaction.member?.user as User; */
    await interaction.deferReply()

    const infractions: DBInfraction[] = await Database.Db.infraction.findMany({
      where: {
        guild: {
          equals: interaction.guild?.id
        },
        user: {
          equals: user.id
        }
      }
    })
    const filtered = infractions.filter(infraction => (!infraction.deleted)).reverse();
    if(filtered.length <= 0) {
      const e = new NeutralEmbed(interaction.guild?.id!)
      e.setDescription(await (await e.translation).get("cmd.infraction.list.no-infractions"))
      return await interaction.editReply({
        embeds: [e]
      })
    }
    const chunkSize = 3;
    const infractionsChunks: DBInfraction[][] = [];
    for (let i = 0; i < filtered.length; i += chunkSize) {
      infractionsChunks.push(filtered.slice(i, i + chunkSize));
    }
    const warns = filtered.filter(inf => (inf.type == "warn"))

    const pages: EmbedBuilder[] = [];
    for (const chunk of infractionsChunks) {
      /* let chunk: Infraction[]

      if(!showhidden) {
        chunk = ch.filter(c => (c.deleted == false || c.deleted == null))
      } else {
        chunk = ch
      } */
      if(chunk.length <= 0) continue

      const e = new NeutralEmbed(interaction.guild?.id!)
      e.setTitle(await (await e.translation).get("cmd.infraction.list.neutral.title"))
      e.setFooter({
        text: `${(await (await e.translation).get("cmd.infraction.list.footer-page")).toString().replace("{CURRENTPAGE}", (infractionsChunks.indexOf(chunk) + 1).toString()).replace("{TOTALPAGES}", infractionsChunks.length.toString())}${filtered.length < 999999999999 ? ((await (await e.translation).get("cmd.infraction.list.footer-infractions")).replace("{TOTALINFRACTIONS}", filtered.length.toString())) : ""}${(warns.length < 999999999999 || warns.length <= 0) ? (await (await e.translation).get("cmd.infraction.list.footer-warns")).replace("{TOTALWARNS}", warns.length.toString()) : ""}`
      })
      /* `Page ${infractionsChunks.indexOf(chunk) + 1}/${infractionsChunks.length}
      ${filtered.length < 999999999999 ? ` | Total infractions: ${filtered.length}` : ""}
      ${(warns.length < 999999999999 || warns.length <= 0) ? ` | Total warns: ${warns.length}` : ""}` */
      e.setDescription(`<@${chunk[0].user}>\n\n` + (await Promise.all(chunk.map(async (infraction) => (
        (await (await e.translation).get("cmd.infraction.list.desc-infraction"))
          .replace("{INFRACTIONTYPE}", infraction.type)
          .replace("{ID}", infraction.id.toString())
          .replace("{MODERATOR}", infraction.author)
          .replace("{REASON}", infraction.reason ? `\`${infraction.reason}\`` : await (await e.translation).get("none-word"))
          .replace("{CREATIONDATE}", `<t:${Math.floor(infraction.creationdate.getTime() / 1000)}:f>`)
        +
        (infraction.timeuntil ? (
          (await (await e.translation).get("common.desc-infraction.time"))
            .replace("{TIME}", Format.secondsToHms(infraction.timeuntil!))
         ) : "")
      )))).join('\n\n'));
      /* `
      **Type:** ${infraction.type}\n
      **Moderator:** <@${infraction.author}>\n
      **Reason:** ${infraction.reason ? `\`${infraction.reason}\`` : "*None*"}\n
      **Creation Date:** <t:${Math.floor(infraction.creationdate.getTime() / 1000)}:f>
      ${infraction.timeuntil ? `\n**Time:** ${Format.secondsToHms(infraction.timeuntil!)}` : ""}
      ` */
      pages.push(e);
    }

    const pagination = new Pagination(interaction as ChatInputCommandInteraction<"cached">)
    pagination.setEmbeds(pages)
    pagination.render()
  }

  @Slash({
    name: "remove",
    description: "Removes a user's infraction"
  })
  @SlashGroup("infraction")
  @Guard(NotAdmin)
  async remove (
    @SlashOption({
      name: "id",
      description: "ID of the infraction to remove",
      type: ApplicationCommandOptionType.String,
      required: true
    })
    id: string,
    interaction: ChatInputCommandInteraction
  ) {
    await interaction.deferReply()

    const e = new ErrorEmbed(interaction.guild?.id)
    e.setDescription(await (await e.translation).get("common.error.invalid-object-id"), true)

    if(!RumcajsId.isValid(id)) {
      return await interaction.editReply({
        embeds: [e]
      })
    }

    const inf = await Database.Db.infraction.findUnique({
      where: {
        id: id
      }
    }).catch(() => {})
    if(inf?.deleted == true || inf?.guild != interaction.guild?.id) return await interaction.editReply({
      embeds: [e]
    })

    await User1.setPoints(inf?.author!, inf?.guild!, InfractionToPoints[inf?.type!])

    await Database.Db.infraction.update({
      where: {
        id: id
      },
      data: {
        deleted: true
      }
    }).then(async () => {
      if(dbSettings.provider == "sqlite") {
        await Database.Db.userAction.create({
          data: {
            creationdate: new Date(),
            type: UserActions.InfractionRemove,
            user: interaction.user.id,
            data: JSON.stringify({
              id: id
            }),
            id: RumcajsId.generateId()
          }
        }).catch(() => {})
      } else {
        await Database.Db.userAction.create({
          data: {
            creationdate: new Date(),
            type: UserActions.InfractionRemove,
            user: interaction.user.id,
            data: {
              id: id
            },
            id: RumcajsId.generateId()
          }
        }).catch(() => {})
      }

      const e = new SuccessEmbed(interaction.guild?.id)
      e.setDescription(await (await e.translation).get("infraction.success.removed-infraction"), true)

      interaction.editReply({
        embeds: [e]
      })
    }).catch(async () => {
      return await interaction.editReply({
        embeds: [e]
      })
    })
  }

  @Slash({
    name: "get",
    description: "Get infraction by ID"
  })
  @SlashGroup("infraction")
  @Guard(NotAdmin)
  async get (
    @SlashOption({
      name: "id",
      description: "ID to look up",
      type: ApplicationCommandOptionType.String,
      required: true
    })
    id: string,
    interaction: ChatInputCommandInteraction
  ) {
    await interaction.deferReply()
    const e = new ErrorEmbed(interaction.guild?.id)
    e.setDescription(await (await e.translation).get("common.error.invalid-object-id"), true)

    if(!RumcajsId.isValid(id)) {
      return await interaction.editReply({
        embeds: [e]
      })
    }

    const inf = await Database.Db.infraction.findUnique({
      where: {
        id: id
      }
    }).catch(() => {})
    if(inf?.deleted == true || inf?.guild != interaction.guild?.id || !inf) return await interaction.editReply({
      embeds: [e]
    })
    const scmb = new NeutralEmbed(interaction.guild?.id)
    /* scmb.setDescription((await (await e.translation).get("cmd.infraction.get.desc-infraction"))
      .replace("{INFRACTIONTYPE}", inf.type)
      .replace("{ID}", inf.id.toString())
      .replace("{TARGET}", inf.user)
      .replace("{MODERATOR}", inf.author)
      .replace("{REASON}", inf.reason ? `\`${inf.reason}\`` : await (await e.translation).get("none-word"))
      .replace("{CREATIONDATE}", `<t:${Math.floor(inf.creationdate.getTime() / 1000)}:f>`)
    ) */
    scmb.addFields([
      {
        name: await (await (scmb.translation)).get("cmd.infraction.get.field.user"),
        value: `<@${inf.user}>`,
        inline: true
      },
      {
          name: await (await (scmb.translation)).get("cmd.infraction.get.field.moderator"),
          value: `<@${inf.author}>`,
          inline: true
      },
      {
          name: await (await (scmb.translation)).get("cmd.infraction.get.field.type"),
          value: `\`${inf.type}\``,
          inline: true
      },
      {
          name: await (await (scmb.translation)).get("cmd.infraction.get.field.id"),
          value: `\`${inf.id.toString()}\``,
          inline: true
      },
      {
          name: await (await (scmb.translation)).get("cmd.infraction.get.field.credate"),
          value: `<t:${Math.floor(inf.creationdate.getTime() / 1000)}:f>`,
          inline: true
      }
    ])

    if(inf.reason) scmb.addFields({
      name: await (await (scmb.translation)).get("cmd.infraction.get.field.reason"),
      value: `\`\`\`${inf.reason}\`\`\``,
      inline: false
    })

    if(inf.timeuntil) scmb.addFields({
      name: await (await (scmb.translation)).get("cmd.infraction.get.field.time"),
      value: Format.secondsToHms(inf.timeuntil),
      inline: true
    })

    return await interaction.editReply({
      embeds: [scmb]
    })
  }

  @Slash({
    name: "appeal",
    description: "List the infraction appeals."
  })
  @SlashGroup("infraction")
  @Guard(NotAdmin, GuildExists)
  async getInfractionAppeals (
    @SlashOption({
      name: "member",
      description: "Member",
      type: ApplicationCommandOptionType.User,
      required: true
    })
    u: User,
    interaction: ChatInputCommandInteraction
  ) {
    await interaction.deferReply();
    let user = u;
    const appeals: DBInfractionAppeal[] = await Database.Db.infractionAppeal.findMany({
      where: {
        guild: {
          equals: interaction.guild?.id
        },
        author: {
          equals: user.id
        }
      }
    })
    const filtered = appeals
    if(filtered.length <= 0) {
      const e = new NeutralEmbed(interaction.guild?.id!)
      e.setDescription(await (await e.translation).get("cmd.infraction.list.no-infractions"))
      return await interaction.editReply({
        embeds: [e]
      })
    }
    const chunkSize = 3;
    const infractionsChunks: DBInfractionAppeal[][] = [];
    for (let i = 0; i < filtered.length; i += chunkSize) {
      infractionsChunks.push(filtered.slice(i, i + chunkSize));
    }
    const pages: EmbedBuilder[] = [];
    for (const chunk of infractionsChunks) {
      /* let chunk: Infraction[]

      if(!showhidden) {
        chunk = ch.filter(c => (c.deleted == false || c.deleted == null))
      } else {
        chunk = ch
      } */
      if(chunk.length <= 0) continue

      const e = new NeutralEmbed(interaction.guild?.id!)
      e.setTitle(await (await e.translation).get("cmd.infraction.list.neutral.title"))
      e.setFooter({
        text: `${(await (await e.translation).get("cmd.infraction.list.footer-page")).toString().replace("{CURRENTPAGE}", (infractionsChunks.indexOf(chunk) + 1).toString()).replace("{TOTALPAGES}", infractionsChunks.length.toString())}${filtered.length < 999999999999 ? ((await (await e.translation).get("cmd.infraction.list.footer-infractions")).replace("{TOTALINFRACTIONS}", filtered.length.toString())) : ""}`
      })
      /* `Page ${infractionsChunks.indexOf(chunk) + 1}/${infractionsChunks.length}
      ${filtered.length < 999999999999 ? ` | Total infractions: ${filtered.length}` : ""}
      ${(warns.length < 999999999999 || warns.length <= 0) ? ` | Total warns: ${warns.length}` : ""}` */
      e.setDescription(`<@${chunk[0].author}>\n\n` + (await Promise.all(chunk.map(async (infraction) => (
        (await (await e.translation).get("cmd.infraction.list.desc-infraction"))
          .replace("{INFRACTIONTYPE}", infraction.type)
          .replace("{ID}", infraction.id.toString())
          .replace("{MODERATOR}", infraction.author)
          .replace("{REASON}", infraction.reason ? `\`${infraction.reason}\`` : await (await e.translation).get("none-word"))
          .replace("{CREATIONDATE}", `<t:${Math.floor(infraction.creationdate.getTime() / 1000)}:f>`)
      )))).join('\n\n'));
      /* `
      **Type:** ${infraction.type}\n
      **Moderator:** <@${infraction.author}>\n
      **Reason:** ${infraction.reason ? `\`${infraction.reason}\`` : "*None*"}\n
      **Creation Date:** <t:${Math.floor(infraction.creationdate.getTime() / 1000)}:f>
      ${infraction.timeuntil ? `\n**Time:** ${Format.secondsToHms(infraction.timeuntil!)}` : ""}
      ` */
      pages.push(e);
    }

    const pagination = new Pagination(interaction as ChatInputCommandInteraction<"cached">)
    pagination.setEmbeds(pages)
    pagination.render()
  }
}
/*${moment(infraction.creationdate).format("HH:mm:ss DD.MM.YYYY")}*/
