import { ApplicationCommandOptionType, ChatInputCommandInteraction } from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";
import { EchoUsers } from "../config.js";

@Discord()
class Echo {
  @Slash({
    name: "echo",
    description: "echo"
  })
  async echo (
    @SlashOption({
      name: "message",
      description: "message",
      type: ApplicationCommandOptionType.String,
      required: true
    })
    message: string,
    interaction: ChatInputCommandInteraction
  ) {
    await interaction.deferReply({
      ephemeral: true
    })

    if(!EchoUsers.includes(interaction.member?.user.id!)) {
      return await interaction.editReply({
        content: "ez masz bana"
      })
    }

    await interaction.editReply({
      content: "ok"
    })

    interaction.channel?.send({
      content: message
    })
  }
}
