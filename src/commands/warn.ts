import { ApplicationCommandOptionType, CommandInteraction, GuildMember, User, escapeMarkdown } from "discord.js";
import { Discord, Guard, Slash, SlashOption } from "discordx";
import { Database } from "../db.js";
import { NotAdmin } from "../guards/NotAdmin.js";
import { infractionEmitter } from "../handlers/infractionHandler.js";
import { NeutralEmbed, SuccessEmbed, invalidUserEmbed, targetRanksAreAboveExecutor, tooLongReasonEmbed } from "../misc/embeds.js";
import { PermissionsCheck } from "../misc/permcheck.js";
import { InfractionType } from "../types.js";
import { RumcajsId } from "../misc/id.js";
import { AppealHandler } from "../handlers/appealHandler.js";

@Discord()
class Warn {
  @Slash({
    name: "warn",
    description: "Warns a member of a guild."
  })
  @Guard(NotAdmin)
  async warn(
    @SlashOption({
      name: "member",
      description: "Member to warn",
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

    if(!await PermissionsCheck.canMemberPunishOtherMember(interactionMember, member)) return await interaction.reply({
      embeds: [await targetRanksAreAboveExecutor(interaction.guild?.id!)]
    })

    /* if(await PermissionsCheck.canBePunished(member)) return await interaction.reply({
      embeds: [await userIsAdminEmbed(interaction.guild?.id!)]
    }) */

    await interaction.deferReply({
      ephemeral: ephemeral ? true : false
    });

    const infractionData = {
      type: InfractionType.Warn,
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
      dmembed.setDescription((await (await dmembed.translation).get("dm.warn"))
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

      infractionEmitter.emit("send", out)
      const sembed = new SuccessEmbed(interaction.guild?.id!)
      sembed.setDescription(`${(await (await sembed.translation).get("cmd.warn.warned")).replace("{USER}", `<@${member.id}>`)}${reason ? ` | \`${escapeMarkdown(reason)}\`` : ""}`, true)
      sembed.setFooter({
        text: `${out.id}`
      })

      await interaction.editReply({
        embeds: [sembed]
      })
    })
  }
}


/* (async function a() {
  const Database = (await import("../db.js")).Database
  const { ObjectId } = await import("bson")
  const { SuccessEmbed } = await import("../misc/embeds.js")
  const { Bot } = await import("../bot.js")
  const { infractionEmitter } = await import("../handlers/infractionHandler.js")

  const infractionData = {
    type: "warn",
    id: new ObjectId().toString(),
    author: "1051162989287448576",
    guild: "901213083740033116",
    reason: "śmierdzisz serem (test)",
    user: "501311283493208092",
    creationdate: new Date()
  }

  const member = `<@${infractionData.user}>`
  const reason = infractionData.reason

  await Database.Db.infraction.create({
    data: infractionData
  }).then(async (out) => {
    infractionEmitter.emit("send", infractionData)
    const sembed = new SuccessEmbed(infractionData.guild)
    sembed.setDescription(`${(await (await sembed.translation).get("cmd.warn.warned")).replace("{USER}", `${member}`)}${` | \`${reason}\``}`, true)
    sembed.setFooter({
      text: `${out.id}`
    });

    await Bot.Client.channels.cache.get("1052619738875965460").send({
      embeds: [sembed]
    })
  })
})() */

/* async function b() {
  const Database = (await import("../db.js")).Database
  const { ObjectId } = await import("bson")
  const { checkEmoji, baseSuccessEmbed } = await import("../misc/embeds.js")
  const { Bot } = await import("../bot.js")
  const { infractionEmitter } = await import("../handlers/infractionHandler.js")
  const { EmbedBuilder } = await import("discord.js")

  const infractionData = {
    type: "warn",
    id: new ObjectId().toString(),
    author: "1051162989287448576",
    guild: "901213083740033116",
    reason: "nienawiść na chacie i masz brudne gacie",
    user: "751078930965987439",
    creationdate: new Date()
  }
  const member = `<@${infractionData.user}>`
  const reason = infractionData.reason

  await Database.Db.infraction.create({
      data: infractionData
  }).then(async (out) => {
    infractionEmitter.emit("send", infractionData);
    const sembed = new EmbedBuilder(baseSuccessEmbed.data)
      .setDescription(`***${checkEmoji} ${member} was warned***${reason ? ` | \`${reason}\`` : ""}`)
      .setFooter({
      text: `${out.id}`
    });
    await Bot.Client.channels.cache.get("1052619738875965460").send({
      embeds: [sembed]
    })
  });
} */
