import {
  ButtonInteraction,
  ChannelSelectMenuInteraction,
  ChatInputCommandInteraction,
  CommandInteraction,
  ContextMenuCommandInteraction,
  GuildMember,
  MentionableSelectMenuInteraction,
  MessageContextMenuCommandInteraction,
  ModalSubmitInteraction,
  RoleSelectMenuInteraction,
  StringSelectMenuInteraction,
  UserContextMenuCommandInteraction,
  UserSelectMenuInteraction
} from "discord.js";
import { Client, GuardFunction } from "discordx";
import { userNotAdminEmbed } from "../misc/embeds.js";
import { PermissionsCheck } from "../misc/permcheck.js";
import { Logger } from "../logger.js";

export const NotAdmin: GuardFunction<
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
  if(!(await PermissionsCheck.isAdmin(interaction.member as GuildMember))) {
    return await interaction.reply({
      embeds: [await userNotAdminEmbed(interaction.guild?.id!)]
    })
   } else {
    Logger.Logger.verbose(`${interaction.user.id} has passed ${NotAdmin.name} guard.`)
    await next();
  }
};
