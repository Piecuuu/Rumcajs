import { ObjectId } from "bson";
import { ApplicationCommandOptionType, CommandInteraction, GuildMember, TextChannel, User, escapeMarkdown } from "discord.js";
import { Discord, Guard, Slash, SlashOption } from "discordx";
import { Database } from "../db.js";
import { NeutralEmbed, SuccessEmbed, invalidUserEmbed, targetRanksAreAboveExecutor, tooLongReasonEmbed, userIsAdminEmbed, userNotAdminEmbed } from "../misc/embeds.js";
import { infractionEmitter } from "../handlers/infractionHandler.js";
import { PermissionsCheck } from "../misc/permcheck.js";
import { InfractionType } from "../types.js";
import { NotAdmin } from "../guards/NotAdmin.js";
import { Bot } from "../bot.js";
import { Translation } from "../handlers/lang.js";

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

    await interaction.deferReply();

    const infractionData = {
      type: InfractionType.Warn,
      id: new ObjectId().toString(),
      author: interaction.user.id,
      guild: interaction.guild?.id!,
      reason: reason,
      user: user.id,
      creationdate: new Date()
    }

    await Database.Db.infraction.create({
      data: infractionData
    }).then(async (out) => {
      const dmembed = new NeutralEmbed(interaction.guild?.id)
      dmembed.setDescription((await (await dmembed.translation).get("dm.warn"))
        .replace("{SERVERNAME}", interaction.guild?.name!)

      + (reason ? (await (await dmembed.translation).get("common.dm.for-reason"))
        .replace("{REASON}", reason) : ""))

      await user.send({
        embeds: [dmembed]
      }).catch(() => {})

      infractionEmitter.emit("send", infractionData)
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


/* async function a() {
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
    reason: "nienawiść na chacie i masz brudne gacie",
    user: "751078930965987439",
    creationdate: new Date()
  }

  await Database.Db.infraction.create({
    data: infractionData
  }).then(async (out) => {
    infractionEmitter.emit("send", infractionData)
    const sembed = new SuccessEmbed("901213083740033116")
    sembed.setDescription(`${(await (await sembed.translation).get("cmd.warn.warned")).replace("{USER}", `<@751078930965987439>`)}${` | \`${escapeMarkdown("nienawiść na chacie i masz brudne gacie")}\``}`, true)
    sembed.setFooter({
      text: `${out.id}`
    });

    await Bot.Client.channels.cache.get("1052619738875965460").send({
      embeds: [sembed]
    })
  })
}

async function b() {
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
