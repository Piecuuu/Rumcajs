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
import { memberNotGuildOwner } from "../misc/embeds.js";
import { Logger } from "../logger.js";
import { Owners } from "../config.js";

export const NotOwner: GuardFunction<
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
  if(interaction.user.id == interaction.guild?.ownerId || Owners.includes(interaction.user.id)) {
    Logger.Logger.verbose(`${interaction.user.id} has passed ${NotOwner.name} guard.`)
    await next();
  } else {
    if(!interaction.isRepliable()) return;
    await interaction.reply({
      embeds: [await memberNotGuildOwner(interaction.guild?.id!)]
    })
  }
};
