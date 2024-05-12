import { ObjectId } from "bson";
import { ApplicationCommandOptionType, ChatInputCommandInteraction, GuildMember } from "discord.js";
import { Discord, Guard, Slash, SlashOption } from "discordx";
import { Database } from "../db.js";
import { NotAdmin } from "../guards/NotAdmin.js";
import { ErrorEmbed, SuccessEmbed, invalidUserEmbed } from "../misc/embeds.js";
import { UserActions } from "../types.js";
import { RumcajsId } from "../misc/id.js";

@Discord()
class Unmute {
  @Slash({
    name: "unmute",
    description: "Unmutes a member"
  })
  @Guard(NotAdmin)
  async unmute (
    @SlashOption({
      name: "member",
      description: "Member to unmute",
      type: ApplicationCommandOptionType.User,
      required: true
    })
    user: GuildMember,
    interaction: ChatInputCommandInteraction
  ) {
    await interaction.deferReply()
    if(!(user instanceof GuildMember)) {
      return await interaction.editReply({
        embeds: [await invalidUserEmbed(interaction.guild?.id!)]
      })
    }

    await Database.Db.userAction.create({
      data: {
        creationdate: new Date(),
        type: UserActions.Unmute,
        user: interaction.user.id,
        target: user.id,
        id: RumcajsId.generateId()
      }
    }).catch(() => {})

    if(!user.moderatable) {
      const e = new ErrorEmbed(interaction.guild?.id!)
      e.setDescription(await (await e.translation).get("cmd.unmute.error"), true)

      return await interaction.editReply({
        embeds: [e]
      })
    }

    await user.timeout(1, "Unmuted member").catch(() => {}).then(async () => {
      const okemb = new SuccessEmbed(interaction.guild?.id)
      okemb.setDescription((await (await okemb.translation).get("cmd.unmute.unmuted"))
        .replace("{USER}", `<@${user.id}>`))

      await interaction.editReply({
        embeds: [okemb]
      })
    })
  }
}
