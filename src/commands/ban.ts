import { ObjectId } from "bson";
import { ApplicationCommandOptionType, CommandInteraction, GuildMember, PermissionsBitField, User, escapeMarkdown } from "discord.js";
import { Discord, Guard, Slash, SlashOption } from "discordx";
import { Bot } from "../bot.js";
import { logger } from "../config.js";
import { Database } from "../db.js";
import { NotAdmin } from "../guards/NotAdmin.js";
import { infractionEmitter } from "../handlers/infractionHandler.js";
import { Translation } from "../handlers/lang.js";
import { ErrorEmbed, NeutralEmbed, SuccessEmbed, invalidUserEmbed, noPermissionsEmbed, targetRanksAreAboveExecutor, tooLongReasonEmbed, userIsAdminEmbed } from "../misc/embeds.js";
import { PermissionsCheck } from "../misc/permcheck.js";
import { InfractionType } from "../types.js";
import { RumcajsId } from "../misc/id.js";
import { AppealHandler } from "../handlers/appealHandler.js";

@Discord()
class Ban {
  @Slash({
    name: "ban",
    description: "Bans a member of a guild."
  })
  @Guard(NotAdmin)
  async ban(
    @SlashOption({
      name: "member",
      description: "Member to ban",
      type: ApplicationCommandOptionType.User,
      required: true
    })
    user: User,
    @SlashOption({
      name: "reason",
      description: "Reason",
      type: ApplicationCommandOptionType.String,
      required: false
    })
    reason: string,
    @SlashOption({
      name: "ephemeral",
      description: "Ephemeral (silent)",
      type: ApplicationCommandOptionType.Boolean,
      required: false
    })
    ephemeral: boolean,

    interaction: CommandInteraction
  ) {
    try {
      interaction.guild?.members.fetch(user).catch(async () => {
        return await interaction.reply({
          embeds: [await invalidUserEmbed(interaction.guild?.id!)],
          ephemeral: true
        })
      })
    } catch(err) {
      return await interaction.reply({
        embeds: [await invalidUserEmbed(interaction.guild?.id!)],
        ephemeral: true
      })
    }

    if(reason && (reason.length > 300 || reason.length <= 0)) return await interaction.reply({
      embeds: [await tooLongReasonEmbed(interaction.guild?.id!)],
      ephemeral: true
    })

    let member: GuildMember
    try {
      member = await interaction.guild?.members.fetch(user)!;
    } catch(err) {
      return
    }
    const interactionMember = await interaction.guild?.members.fetch(interaction.user)!;
    const botMember: GuildMember = await interaction.guild?.members.fetch(Bot.Client.user?.id!)!

    if(!await PermissionsCheck.canMemberPunishOtherMember(interactionMember, member)) return await interaction.reply({
      embeds: [await targetRanksAreAboveExecutor(interaction.guild?.id!)]
    })

    if(await PermissionsCheck.canBePunished(member)) return await interaction.reply({
      embeds: [await userIsAdminEmbed(interaction.guild?.id!)]
    })

    if(!await PermissionsCheck.isHavingPermission(botMember, PermissionsBitField.Flags.BanMembers)) {
      return await interaction.reply({
        embeds: [await noPermissionsEmbed(PermissionsBitField.Flags.BanMembers, interaction.guild?.id!)]
      })
    }

    if(!member.bannable) {
      const e = new ErrorEmbed(interaction.guild?.id!)
      e.setDescription(await (await e.translation).get("cmd.ban.not-punishable"), true)

      return await interaction.reply({
        embeds: [e]
      })
    }

    await interaction.deferReply({
      ephemeral: ephemeral ? true : false
    });

    const infractionData = {
      type: InfractionType.Ban,
      author: interaction.user.id,
      guild: interaction.guild?.id!,
      reason: reason,
      user: user.id,
      creationdate: new Date(),
      id: RumcajsId.generateId()
    }

    await Database.Db.infraction.create({
      data: infractionData
    }).then(async (out) => {
      const dmembed = new NeutralEmbed(interaction.guild?.id)
      dmembed.setDescription((await (await dmembed.translation).get("dm.ban"))
        .replace("{SERVERNAME}", interaction.guild?.name!)

        + (reason ? (await (await dmembed.translation).get("common.dm.for-reason"))
          .replace("{REASON}", reason) : ""))
      dmembed.setFooter({
        text: out.id
      });

      const comp = await AppealHandler.createAppealActionRow(interaction.guildId!);
      if(comp != null) {
        await user.send({
          embeds: [dmembed],
          components: [comp]
        }).catch(() => {})
      } else {
        await user.send({
          embeds: [dmembed]
        }).catch(() => {})
      }

      try {
        member.ban({
          reason: `${reason} | ${out.id}`
        }).then(() => {
          infractionEmitter.emit("send", out)
        })
      } catch(err) {
        logger.error(err)
        return await interaction.editReply({
          content: await ((await (new Translation()).init((await Translation.getGuildLangCode(interaction.guild?.id!)))).get("error.unknown-error"))
        })
      }
      const sembed = new SuccessEmbed(interaction.guild?.id!)
      sembed.setDescription(`${(await (await sembed.translation).get("cmd.ban.banned")).replace("{USER}", `<@${member.id}>`)}${reason ? ` | \`${escapeMarkdown(reason)}\`` : ""}`, true)
      sembed.setFooter({
        text: `${out.id}`
      })

      await interaction.editReply({
        embeds: [sembed]
      })
    })
  }
}
