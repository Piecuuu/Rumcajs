import { CommandInteraction, EmbedBuilder } from "discord.js";
import { Discord, Slash } from "discordx";
import { Colors } from "../config";

@Discord()
class pingCommand {
  @Slash({
    name: "ping",
    description: "A basic ping-pong example command.",
  })
  async ping(interaction: CommandInteraction) {
    await interaction.deferReply()
    const embed = new EmbedBuilder()
      .setDescription("Pong :ping_pong:")
      .setColor(Colors.SuccessGreen)
      .setFields([
        {
          name: "API Latency",
          value: `${Math.round(interaction.client.ws.ping)}ms`
        }
      ])

    await interaction.editReply({
      embeds: [embed]
    })
  }
}
