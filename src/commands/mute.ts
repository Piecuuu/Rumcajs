import { DBInfraction } from "../db/connector";
import { ObjectId } from "bson";
import { ApplicationCommandOptionType, ChatInputCommandInteraction, GuildMember, PermissionsBitField, User, escapeMarkdown } from "discord.js";
import { Discord, Guard, Slash, SlashOption } from "discordx";
import { Bot } from "../bot.js";
import { logger } from "../config.js";
import { Database } from "../db.js";
import { infractionEmitter } from "../handlers/infractionHandler.js";
import { ErrorEmbed, NeutralEmbed, SuccessEmbed, invalidUserEmbed, noPermissionsEmbed, targetRanksAreAboveExecutor, timeTooLongEmbed, tooLongReasonEmbed, userIsAdminEmbed, userNotAdminEmbed } from "../misc/embeds.js";
import { Format } from "../misc/format.js";
import { PermissionsCheck } from "../misc/permcheck.js";
import { InfractionType } from "../types.js";
import { Translation } from "../handlers/lang.js";
import { NotAdmin } from "../guards/NotAdmin.js";
import { RumcajsId } from "../misc/id.js";
import { AppealHandler } from "../handlers/appealHandler.js";

@Discord()
class Mute {
  @Slash({
    name: "mute",
    description: "Mutes a member of a guild."
  })
  @Guard(NotAdmin)
  async mute(
    @SlashOption({
      name: "member",
      description: "Member to mute",
      type: ApplicationCommandOptionType.User,
      required: true
    })
    user: User,
    @SlashOption({
      name: "time",
      description: "Time",
      type: ApplicationCommandOptionType.String,
      required: true
    })
    time: string,
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
    interaction: ChatInputCommandInteraction
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

    /* if(await PermissionsCheck.canBePunished(member)) return await interaction.reply({
      embeds: [await userIsAdminEmbed(interaction.guild?.id!)]
    }) */

    if(!await PermissionsCheck.isHavingPermission(botMember, PermissionsBitField.Flags.ModerateMembers)) {
      return await interaction.reply({
        embeds: [await noPermissionsEmbed(PermissionsBitField.Flags.ModerateMembers, interaction.guild?.id!)]
      })
    }

    if(!member.moderatable) {
      const e = new ErrorEmbed(interaction.guild?.id!)
      e.setDescription(await (await e.translation).get("cmd.mute.not-punishable"), true)

      return await interaction.reply({
        embeds: [e]
      })
    }

    let toMS: number | null = null;
    try {
      toMS = Format.convertToMilliseconds(time)
    } catch(err) {
      const perr = JSON.parse(err.message)
      if(perr.code == 0) {
        const code0emb = new ErrorEmbed(interaction.guild?.id!)
        code0emb.setDescription((await (await code0emb.translation).get("common.error.time-unit-invalid")).replace("{UNIT}", escapeMarkdown(perr.data.unit)))
        return await interaction.reply({
          embeds: [code0emb],
          ephemeral: true
        })
      } else if(perr.code == 1) {
        const code1emb = new ErrorEmbed(interaction.guild?.id!)
        code1emb.setDescription((await (await code1emb.translation).get("common.error.time-duration-not-positive")))
        return await interaction.reply({
          embeds: [code1emb],
          ephemeral: true
        })
      }
      return await interaction.reply({
        content: await ((await (new Translation()).init((await Translation.getGuildLangCode(interaction.guild?.id!)))).get("error.unknown-error"))
      })
    }

    await interaction.deferReply({
      ephemeral: ephemeral ? true : false
    });

    const infractionData = {
      type: InfractionType.Mute,
      author: interaction.user.id,
      guild: interaction.guild?.id!,
      reason: reason,
      user: user.id,
      creationdate: new Date(),
      timeuntil: toMS / 1000,
      id: RumcajsId.generateId()
    }

    if(!Number.isSafeInteger(infractionData.timeuntil!) || toMS! > 2332800001) {
      return await interaction.editReply({
        embeds: [await timeTooLongEmbed(interaction.guild?.id!)]
      })
    }

    /* if(toMS! > 2246400001) return await interaction.editReply({
      embeds: [await timeTooLongEmbed(interaction.guild?.id!)]
    }) */

    await Database.Db.infraction.create({
      data: infractionData
    }).then(async (out) => {
      try {
        const dmembed = new NeutralEmbed(interaction.guild?.id)
        dmembed.setDescription((await (await dmembed.translation).get("dm.mute"))
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

        member.timeout(toMS, reason).then(() => {
          infractionEmitter.emit("send", out)
        }).catch(async () => {
          return await interaction.editReply({
            content: await ((await (new Translation()).init((await Translation.getGuildLangCode(interaction.guild?.id!)))).get("error.unknown-error"))
          })
        })
      } catch(err) {
        logger.error(err)
        return await interaction.editReply({
          content: await ((await (new Translation()).init((await Translation.getGuildLangCode(interaction.guild?.id!)))).get("error.unknown-error"))
        })
      }

      let mstostr;
      try {mstostr = Format.secondsToHms((toMS ? toMS : 1000) / 1000)} catch(err) {
        if(err.message.toLowerCase() == "time too long") {
          return await interaction.editReply({
            embeds: [await timeTooLongEmbed(interaction.guild?.id!)]
          })
        } else {
          return await interaction.editReply({
            content: await ((await (new Translation()).init((await Translation.getGuildLangCode(interaction.guild?.id!)))).get("error.unknown-error"))
          })
        }
      }

      const sembed = new SuccessEmbed(interaction.guild?.id!)
      sembed.setDescription(`${(await (await sembed.translation).get("cmd.mute.muted")).replace("{USER}", `<@${member.id}>`)}${reason ? ` | \`${escapeMarkdown(reason)}\`` : ""}${toMS ? ` | ${mstostr}` : ""}`, true)
      sembed.setFooter({
        text: `${out.id}`
      })

      await interaction.editReply({
        embeds: [sembed]
      })
    })
  }
}
