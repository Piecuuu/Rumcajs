import { ApplicationCommandOptionType, ChatInputCommandInteraction, EmbedBuilder, GuildMember, User, escapeMarkdown } from "discord.js";
import { Discord, Guard, Slash, SlashOption } from "discordx";
import { Database } from "../db.js";
import { NeutralEmbed, userNotAdminEmbed } from "../misc/embeds.js";
import { Infraction } from "@prisma/client";
import { Pagination } from "pagination.djs";
import { Format } from "../misc/format.js";
import { PermissionsCheck } from "../misc/permcheck.js";
import { NotAdmin } from "../guards/NotAdmin.js";

@Discord()
class Moderator {
  @Slash({
    name: "moderator",
    description: "Give info about a moderator."
  })
  @Guard(NotAdmin)
  async moderator(
    @SlashOption({
      name: "user",
      description: "Moderator to lookup.",
      type: ApplicationCommandOptionType.User,
      required: true
    })
    user: User,
    interaction: ChatInputCommandInteraction
  ) {
    await interaction.deferReply()

    const infractions = await Database.Db.infraction.findMany({
      where: {
        author: {
          equals: user.id
        },
        guild: {
          equals: interaction.guild?.id
        }
      },
    })
    const filtered = infractions.filter(infraction => (!infraction.deleted))
    if(filtered.length <= 0) {
      const e = new NeutralEmbed(interaction.guild?.id!)
      e.setDescription(await (await e.translation).get("cmd.moderator.neutral.no-infractions-given"))

      return await interaction.editReply({
        embeds: [e]
      })
    }

/*     const e = new NeutralEmbed(interaction.guild?.id!)
    e.setDescription(await e.translation.get("error.invalid-user"))
    interaction.channel?.send({
      embeds: [e]
    }) */

    const chunkSize = 3;
    const infractionsChunks: Infraction[][] = [];
    for (let i = 0; i < filtered.length; i += chunkSize) {
      infractionsChunks.push(filtered.slice(i, i + chunkSize));
    }
    const warns = filtered.filter(inf => (inf.type == "warn"))

    const pages: EmbedBuilder[] = [];
    for (const chunk of infractionsChunks) {
      if(chunk.length <= 0) continue

      const e = new NeutralEmbed(interaction.guild?.id!)
      e.setTitle(await (await e.translation).get("cmd.moderator.neutral.lookup-title"))
      e.setFooter({
        text: `${(await (await e.translation).get("cmd.moderator.neutral.footer-page")).toString().replace("{CURRENTPAGE}", (infractionsChunks.indexOf(chunk) + 1).toString()).replace("{TOTALPAGES}", infractionsChunks.length.toString())}${filtered.length < 999999999999 ? ((await (await e.translation).get("cmd.moderator.neutral.footer-infractions")).replace("{INFRACTIONSGIVEN}", filtered.length.toString())) : ""}${(warns.length < 999999999999 || warns.length <= 0) ? (await (await e.translation).get("cmd.moderator.neutral.footer-warns")).replace("{WARNSGIVEN}", warns.length.toString()) : ""}`
      })
      e.setDescription(`<@${user.id}>\n\n` + (await Promise.all(chunk.map(async (infraction) => (
        (await (await e.translation).get("cmd.moderator.neutral.desc-infraction"))
          .replace("{INFRACTIONTYPE}", infraction.type)
          .replace("{TARGET}", infraction.user)
          .replace("{REASON}", infraction.reason ? `\`${escapeMarkdown(infraction.reason)}\`` : await (await e.translation).get("none-word"))
          .replace("{CREATIONDATE}", `<t:${Math.floor(infraction.creationdate.getTime() / 1000)}:f>`)
          .replace("{ID}", infraction.id)
        + (infraction.timeuntil ? (
          (await (await e.translation).get("common.desc-infraction.time"))
            .replace("{TIME}", Format.secondsToHms(infraction.timeuntil!))
          ) : "")
      )))).join('\n\n'));
      pages.push(e); // kill me
    }

    const pagination = new Pagination(interaction as ChatInputCommandInteraction<"cached">)
    pagination.setEmbeds(pages)
    pagination.render()
  }
}

/* `**Type:** ${infraction.type}\n
**User:** <@${infraction.user}>\n
**Reason:** ${infraction.reason ? `\`${escapeMarkdown(infraction.reason)}\`` : "*None*"}\n
**Creation Date:** <t:${Math.floor(infraction.creationdate.getTime() / 1000)}:f>
${infraction.timeuntil ? `\n**Time:** ${Format.secondsToHms(infraction.timeuntil!)}` : ""}` */
