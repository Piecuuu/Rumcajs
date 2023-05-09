import { ArgsOf, Discord, On } from "discordx";
import { Bot } from "../bot.js";
import { Logger } from "../logger.js";
import { InteractionType } from "discord.js";

@Discord()
class interactionCreate {
  @On({
    event: "interactionCreate"
  })
  private onInteraction (
    [interaction]: ArgsOf<"interactionCreate">
  ) {
    Logger.Logger.verbose(`Executed ${InteractionType[interaction.type]} in ${interaction.guild?.id} by ${interaction.member?.user.id}`)
    Bot.Client.executeInteraction(interaction);
  }
}
