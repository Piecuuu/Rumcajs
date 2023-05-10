import {
  ButtonInteraction,
  ChannelSelectMenuInteraction,
  ChatInputCommandInteraction,
  CommandInteraction,
  ContextMenuCommandInteraction,
  MentionableSelectMenuInteraction,
  MessageContextMenuCommandInteraction,
  ModalSubmitInteraction,
  RoleSelectMenuInteraction,
  StringSelectMenuInteraction,
  UserContextMenuCommandInteraction,
  UserSelectMenuInteraction
} from "discord.js";
import { Client, GuardFunction } from "discordx";
import { Database } from "../db.js";
import { ErrorEmbed } from "../misc/embeds.js";

export const GuildExists: GuardFunction<
  | ButtonInteraction
  | ChannelSelectMenuInteraction
  | CommandInteraction
  | ContextMenuCommandInteraction
  | MentionableSelectMenuInteraction
  | ModalSubmitInteraction
  | RoleSelectMenuInteraction
  | StringSelectMenuInteraction
  | UserSelectMenuInteraction
  | UserContextMenuCommandInteraction
  | MessageContextMenuCommandInteraction
  | ChatInputCommandInteraction
> = async (interaction, client: Client, next) => {
  const exists = await Database.Db.guild.count({
    where: {
      guildid: interaction.guild?.id
    }
  })
  if(exists == 0) {
    const slc = (await interaction.guild?.commands.fetch()!).filter(cmd => {
      return cmd.name == "configuration"
    })
    const e = new ErrorEmbed(interaction.guild?.id!)
    e.setDescription((await (await e.translation).get("common.error.guild-not-set-up"))
      .replace("{CMDMENTION}", `</configuration setup:${slc?.first()?.id ?? "`/configuration setup`"}>`)) //(await client.application?.commands.cache.get("configuration"))?.id
    return await interaction.reply({
      embeds: [e]
    })
  } else {
    await next()
  }
};
