import { ObjectId } from "bson";
import { ApplicationCommandOptionType, BaseGuildTextChannel, ChannelType, ChatInputCommandInteraction, GuildMember, PermissionFlagsBits } from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";
import { Bot } from "../bot.js";
import { dbSettings, logger } from "../config.js";
import { Database } from "../db.js";
import { ErrorEmbed, SuccessEmbed, memberNoPermsEmbed, noPermissionsEmbed } from "../misc/embeds.js";
import { PermissionsCheck } from "../misc/permcheck.js";
import { UserActions } from "../types.js";
import { RumcajsId } from "../misc/id.js";
import { DBUserAction } from "../db/connector.js";

@Discord()
class clearCommand {
  @Slash({
    name: "clear",
    description: "Clears x amount of messages in a provided channel or the current channel. Max 100 messages.",
  })
  private async clear (
    @SlashOption({
      name: "amount",
      description: "Amount of messages to clear (max 100)",
      type: ApplicationCommandOptionType.Number,
      required: true
    })
    amount: number,
    @SlashOption({
      name: "channel",
      description: "Channel to clear the messages from",
      type: ApplicationCommandOptionType.Channel,
      required: false
    })
    channel: BaseGuildTextChannel,
    interaction: ChatInputCommandInteraction
  ) {
    if(!PermissionsCheck.isHavingPermission(interaction.member as GuildMember, PermissionFlagsBits.ManageMessages)) return await interaction.reply({
      embeds: [await memberNoPermsEmbed(PermissionFlagsBits.ManageMessages, interaction.guild?.id!)]
    })

    if(amount > 100) {
      const e = new ErrorEmbed(interaction.guild?.id!)
      e.setDescription(await (await e.translation).get("cmd.clear.error.limit"), true);
      return await interaction.reply({
        embeds: [e],
        ephemeral: true
      })
    }

    if(amount <= 0) {
      const e = new ErrorEmbed(interaction.guild?.id!)
      e.setDescription(await (await e.translation).get("common.error.number-negative"), true);
      return await interaction.reply({
        embeds: [e],
        ephemeral: true
      })
    }

    if((!interaction.channel) || interaction.channel.type == ChannelType.DM) {
      const e = new ErrorEmbed(interaction.guild?.id!)
      e.setDescription(await (await e.translation).get("cmd.clear.nonexistent-channel"), true);

      return await interaction.reply({
        embeds: [e],
        ephemeral: true
      })
    }

    if(channel && channel?.type != ChannelType.GuildText) {
      const e = new ErrorEmbed(interaction.guild?.id!)
      e.setDescription(await (await e.translation).get("cmd.clear.channel-arg-invalid"), true);
      return await interaction.reply({
        embeds: [e],
        ephemeral: true
      })
    }

    await interaction.deferReply()

    if(!PermissionsCheck.isHavingPermission((await interaction.guild?.members.fetch(Bot.Client.user?.id!) as GuildMember), PermissionFlagsBits.ManageMessages)) {
      return await interaction.editReply({
        embeds: [await noPermissionsEmbed(PermissionFlagsBits.ManageMessages, interaction.guild?.id!)]
      })
    }

    try {
      const e = new SuccessEmbed(interaction.guild?.id!)
      e.setDescription((await (await e.translation).get("cmd.clear.success.deleted"))
        .replace("{AMOUNT}", amount.toString())
        .replace("{CHANNEL}", `${(channel ? channel : interaction.channel)}`)
      , true);
      e.setFooter({
        text: (await (await e.translation).get("common.executed-by"))
          .replace("{USER}", interaction.user.tag),
        iconURL: interaction.user.displayAvatarURL({
          extension: "webp",
          forceStatic: false,
          size: 512
        })
      })

      await interaction.editReply({
        embeds: [e]
      }).then(() => {
        (channel ? channel : interaction.channel as BaseGuildTextChannel).bulkDelete(amount).then(async () => {
          const data = {
            data: {
              creationdate: new Date(),
              type: UserActions.Clear,
              user: interaction.user.id,
              data: {
                amount: amount,
                channel: channel ? channel.id : interaction.channelId
              },
              id: RumcajsId.generateId()
            }
          }
          const sqlited = {
            data: {
              creationdate: new Date(),
              type: UserActions.Clear,
              user: interaction.user.id,
              data: JSON.stringify({
                amount: amount,
                channel: channel ? channel.id : interaction.channelId
              }),
              id: RumcajsId.generateId()
            }
          }

          await Database.Db.userAction.create(((dbSettings.provider == "sqlite") ? sqlited : data) as any).catch(() => {})

          channel ?? await interaction.channel?.send({
            embeds: [e]
          })
        })
      });
    } catch(err) {
      logger.error(err as string)
      const e = new ErrorEmbed(interaction.guild?.id!)
      e.setDescription(await (await e.translation).get("error.unknown-error"), true);
      await interaction.editReply({
        embeds: [e]
      })
    }
  }
}
