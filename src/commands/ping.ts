import { CommandInteraction } from "discord.js";
import { Discord, Slash } from "discordx";
import { SuccessEmbed } from "../misc/embeds.js";

@Discord()
class pingCommand {
  @Slash({
    name: "ping",
    description: "A basic ping-pong command.",
  })
  async ping(interaction: CommandInteraction) {
    await interaction.deferReply()
    const embed = new SuccessEmbed()
      .setDescription("Pong :ping_pong:", false)
      .setFields([
        {
          name: "API Latency",
          value: `${Math.round(interaction.client.ws.ping)}ms`
        }
      ])
    interaction.guild

    await interaction.editReply({
      embeds: [embed]
    })
  }
}
