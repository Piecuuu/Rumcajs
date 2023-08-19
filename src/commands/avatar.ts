import { ApplicationCommandOptionType, ChatInputCommandInteraction, GuildMember, User } from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";
import { NeutralEmbed } from "../misc/embeds.js";

@Discord()
class Avatar {
  @Slash({
    name: "avatar",
    description: "Displays the avatar of the user"
  })
  async avatar(
    @SlashOption({
      name: "user",
      description: "User to get the avatar from.",
      type: ApplicationCommandOptionType.User,
      required: false
    })
    user: GuildMember,
    interaction: ChatInputCommandInteraction
  ) {
    await interaction.deferReply()

    if(!user) user = interaction.member as GuildMember

    const avatars: {
      webp: string,
      jpg: string,
      png: string,
      gif: string
    } = {
      webp: "",
      jpg: "",
      png: "",
      gif: ""
    }

    const emb = new NeutralEmbed(interaction.guild?.id)

    if(user instanceof User) {
      avatars.webp = user.avatarURL({
        extension: "webp",
        forceStatic: false,
        size: 1024
      }) ?? user.user.defaultAvatarURL

      avatars.gif = user.avatarURL({
        extension: "gif",
        forceStatic: false,
        size: 1024
      }) ?? user.user.defaultAvatarURL

      avatars.png = user.avatarURL({
        extension: "png",
        forceStatic: false,
        size: 1024
      }) ?? user.user.defaultAvatarURL

      avatars.jpg = user.avatarURL({
        extension: "jpg",
        forceStatic: false,
        size: 1024
      }) ?? user.user.defaultAvatarURL

      emb.setAuthor({
        name: user.tag,
        iconURL: avatars.webp
      })

    } else if(user instanceof GuildMember) {
      avatars.webp = user.user.avatarURL({
        extension: "webp",
        forceStatic: false,
        size: 1024
      }) ?? user.user.defaultAvatarURL

      avatars.gif = user.user.avatarURL({
        extension: "gif",
        forceStatic: false,
        size: 1024
      }) ?? user.user.defaultAvatarURL

      avatars.png = user.user.avatarURL({
        extension: "png",
        forceStatic: false,
        size: 1024
      }) ?? user.user.defaultAvatarURL

      avatars.jpg = user.user.avatarURL({
        extension: "jpg",
        forceStatic: false,
        size: 1024
      }) ?? user.user.defaultAvatarURL

      emb.setAuthor({
        name: user.user.tag,
        iconURL: avatars.webp
      })
    }

    emb.setDescription(`[\`\[png\]\`](${avatars.png}) [\`\[gif\]\`](${avatars.gif}) [\`\[jpg\]\`](${avatars.jpg}) [\`\[webp\]\`](${avatars.webp})`)
    emb.setImage(avatars.webp)

    await interaction.editReply({
      embeds: [emb]
    })
  }
}
