import { ApplicationCommandOptionType, Attachment, AttachmentBuilder, CommandInteraction, EmbedBuilder, GuildMember, User } from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";
import { Colors } from "../config.js";
import { Database } from "../db.js";
import { Bot } from "../bot.js";
import { ObjectId } from "bson";
import { InfractionType } from "../types.js";

@Discord()
class Find {
  /* @Slash({
    name: "find",
    description: "a."
  }) */
  async warn(
    @SlashOption({
      name: "user",
      description: "User to find",
      type: ApplicationCommandOptionType.User,
      required: true
    })
    user: User,

    interaction: CommandInteraction
  ) {
    await interaction.deferReply();

    const users = await Database.Db.infraction.findMany({
      where: {
        user: {
          equals: user.id
        }
      }
    })
    const str = JSON.stringify(users, null, 2)
    const buffer = Buffer.from(str)
    const attachment = new AttachmentBuilder(buffer, {
      name: "amogus.json"
    })

    await interaction.editReply({
      files: [attachment]
    })

    //debugger
  }
}
