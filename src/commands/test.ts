import { ApplicationCommandOptionType, CommandInteraction } from "discord.js";
import { Discord, Slash, SlashChoice, SlashGroup, SlashOption } from "discordx";

@Discord()
@SlashGroup({ description: "testing", name: "testing" })
export class Example {
  @Slash({ description: "b", name: "c" })
  @SlashGroup("testing")
  async min(
    @SlashOption({
      description: "input",
      name: "input",
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    input: string,
    interaction: CommandInteraction
  ) {
    await interaction.reply(`${input}`);
  }
  @Slash({ description: "sus", name: "a" })
  @SlashGroup("testing")
  async a(
    @SlashOption({
      description: "b",
      name: "a",
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    input: string,
    interaction: CommandInteraction
  ) {
    await interaction.reply(`${input}`);
  }
}
