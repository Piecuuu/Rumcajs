import { Infraction } from "@prisma/client";
import { ObjectId } from "bson";
import { ApplicationCommandOptionType, ChatInputCommandInteraction, EmbedBuilder, User } from "discord.js";
import { Discord, Guard, Slash, SlashGroup, SlashOption } from "discordx";
import { Pagination } from "pagination.djs";
import { Database } from "../db.js";
import { NotAdmin } from "../guards/NotAdmin.js";
import { ErrorEmbed, NeutralEmbed, SuccessEmbed } from "../misc/embeds.js";
import { Format } from "../misc/format.js";

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

    const infractions: Infraction[] = await Database.Db.infraction.findMany({
      where: {
        guild: {
          equals: interaction.guild?.id
        },
        user: {
          equals: user.id
        }
      }
    })
    const filtered = infractions.filter(infraction => (!infraction.deleted))
    if(filtered.length <= 0) {
      const e = new NeutralEmbed(interaction.guild?.id!)
      e.setDescription(await (await e.translation).get("cmd.infraction.list.no-infractions"))
      return await interaction.editReply({
        embeds: [e]
      })
    }
    const chunkSize = 3;
    const infractionsChunks: Infraction[][] = [];
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
          .replace("{ID}", infraction.id)
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

    if(!ObjectId.isValid(id)) {
      return await interaction.editReply({
        embeds: [e]
      })
    }

    const inf = await Database.Db.infraction.findUnique({
      where: {
        id: id
      }
    }).catch(() => {})
    if(inf?.deleted == true) return await interaction.editReply({
      embeds: [e]
    })

    await Database.Db.infraction.update({
      where: {
        id: id
      },
      data: {
        deleted: true
      }
    }).then(async () => {
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
}
/*${moment(infraction.creationdate).format("HH:mm:ss DD.MM.YYYY")}*/
