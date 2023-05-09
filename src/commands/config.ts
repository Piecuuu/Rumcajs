import { ApplicationCommandOptionType, Channel, ChatInputCommandInteraction, MessageReaction, Role, User } from "discord.js";
import { Discord, Guard, Slash, SlashGroup, SlashOption } from "discordx";
import { APIGuild } from "../api/routes/guild.js";
import { Database } from "../db.js";
import { GuildExists } from "../guards/GuildExists.js";
import { NotAdmin } from "../guards/NotAdmin.js";
import { ErrorEmbed, NeutralEmbed, SuccessEmbed } from "../misc/embeds.js";
import { LanguageFlags, Translation } from "../handlers/lang.js";
import { NotOwner } from "../guards/NotOwner.js";

@Discord()
@SlashGroup({ name: "configuration", description: "Commands for configuring the bot." })
@SlashGroup({ name: "add", description: "add", root: "configuration" })
@SlashGroup({ name: "remove", description: "remove", root: "configuration" })
@SlashGroup({ name: "list", description: "list", root: "configuration" })
@SlashGroup({ name: "set", description: "set", root: "configuration" })
@SlashGroup({ name: "clear", description: "clear", root: "configuration" })
class Config {

  //TODO: Add a Select Menu to the modrole. https://discord.com/developers/docs/interactions/message-components#select-menus
  @Slash({
    name: "modrole",
    description: "Adds a modrole",
  })
  @SlashGroup("add", "configuration")
  @Guard(NotOwner, GuildExists)
  async addModRole (
    @SlashOption({
      name: "role",
      description: "Role to add to modroles",
      type: ApplicationCommandOptionType.Role,
      required: true
    })
    role: Role,
    interaction: ChatInputCommandInteraction
  ) {
    await interaction.deferReply({
      ephemeral: true
    })
    const oldRoles = await Database.Db.guild.findUnique({
      where: {
        guildid: interaction.guild?.id
      },
      select: {
        adminRoles: true
      }
    })

    if(oldRoles?.adminRoles.length! > 100) {
      const e = new ErrorEmbed(interaction.guild?.id!)
      e.setDescription(await (await e.translation).get("cmd.config.modrole.add.error.max-modrole-reached"), true)
      return await interaction.editReply({
        embeds: [e]
      })
    }


    if(oldRoles?.adminRoles.includes(role.id)) {
      const e = new ErrorEmbed(interaction.guild?.id!)
      e.setDescription(await (await e.translation).get("cmd.config.modrole.add.error.modrole-already-added"), true)
      return await interaction.editReply({
        embeds: [e]
      })
    }

    await Database.Db.guild.update({
      where: {
        guildid: interaction.guild?.id
      },
      data: {
        adminRoles: oldRoles?.adminRoles.concat(role.id)
      }
    }).then(async () => {
      const e = new SuccessEmbed(interaction.guild?.id)
      e.setDescription(await (await e.translation).get("cmd.config.modrole.add.success.modrole-added"), true)
      return await interaction.editReply({
        embeds: [e]
      })
    }).catch(() => {})
  }

  @Slash({
    name: "modrole",
    description: "Removes a modrole",
  })
  @SlashGroup("remove", "configuration")
  @Guard(NotOwner, GuildExists)
  async removeModRole (
    @SlashOption({
      name: "role",
      description: "Role to add to modroles",
      type: ApplicationCommandOptionType.Role,
      required: true
    })
    role: Role,
    interaction: ChatInputCommandInteraction
  ) {
    await interaction.deferReply({
      ephemeral: true
    })
    const oldRoles = await Database.Db.guild.findUnique({
      where: {
        guildid: interaction.guild?.id
      },
      select: {
        adminRoles: true
      }
    })/* .catch(async () => {
      const e = new ErrorEmbed(interaction.guild?.id!)
      e.setDescription(await (await e.translation).get("common.error.guild-not-set-up"))
      return await interaction.editReply({
        embeds: [e]
      })
    }) */

    if(!oldRoles?.adminRoles.includes(role.id)) {
      const e = new ErrorEmbed(interaction.guild?.id!)
      e.setDescription(await (await e.translation).get("cmd.config.modrole.remove.error.modrole-not-existent"), true)
      return await interaction.editReply({
        embeds: [e]
      })
    }

    const filtered = oldRoles?.adminRoles.filter((r) => {
      r != role.id
    })

    await Database.Db.guild.update({
      where: {
        guildid: interaction.guild?.id
      },
      data: {
        adminRoles: filtered
      }
    }).then(async () => {
      const e = new SuccessEmbed(interaction.guild?.id)
      e.setDescription(await (await e.translation).get("cmd.config.modrole.remove.success.modrole-removed"), true)
      return await interaction.editReply({
        embeds: [e]
      })
    }).catch(() => {})
  }

  @Slash({
    name: "specialrole",
    description: "Edit special role.",
  })
  @SlashGroup("set", "configuration")
  @Guard(NotOwner, GuildExists)
  async setSpecialRole (
    @SlashOption({
      name: "role",
      description: "Role to set as special.",
      type: ApplicationCommandOptionType.Role,
      required: true
    })
    role: Role,
    interaction: ChatInputCommandInteraction
  ) {
    await interaction.deferReply({
      ephemeral: true
    })
    await Database.Db.guild.update({
      where: {
        guildid: interaction.guild?.id!
      },
      data: {
        specialRole: role.id
      }
    }).then(async () => {
      const e = new SuccessEmbed(interaction.guild?.id)
      e.setDescription(await (await e.translation).get("cmd.config.specialrole.edit.success.specialrole-added"), true)
      return await interaction.editReply({
        embeds: [e]
      })
    }).catch(() => {})
  }

  @Slash({
    name: "specialrole",
    description: "Edit special role.",
  })
  @SlashGroup("clear", "configuration")
  @Guard(NotOwner, GuildExists)
  async clearSpecialRole (
    interaction: ChatInputCommandInteraction
  ) {
    await interaction.deferReply({
      ephemeral: true
    })
    await Database.Db.guild.update({
      where: {
        guildid: interaction.guild?.id!
      },
      data: {
        specialRole: null
      }
    }).then(async () => {
      const e = new SuccessEmbed(interaction.guild?.id)
      e.setDescription(await (await e.translation).get("cmd.config.specialrole.clear.success.specialrole-cleared"), true)
      return await interaction.editReply({
        embeds: [e]
      })
    }).catch(() => {})
  }

  @Slash({
    name: "alertchannel",
    description: "Set the alert channel.",
  })
  @SlashGroup("set", "configuration")
  @Guard(NotOwner, GuildExists)
  async setAlertChannel (
    @SlashOption({
      name: "channel",
      description: "Channel to set as the alert channel.",
      type: ApplicationCommandOptionType.Channel,
      required: true
    })
    channel: Channel,
    interaction: ChatInputCommandInteraction
  ) {
    await interaction.deferReply({
      ephemeral: true
    })
    await Database.Db.guild.update({
      where: {
        guildid: interaction.guild?.id!
      },
      data: {
        alertChannel: channel.id
      }
    }).then(async () => {
      const e = new SuccessEmbed(interaction.guild?.id)
      e.setDescription(await (await e.translation).get("cmd.config.alertchannel.set.success.alertchannel-set"), true)
      return await interaction.editReply({
        embeds: [e]
      })
    }).catch(() => {})
  }

  @Slash({
    name: "alertchannel",
    description: "Clear the alert channel.",
  })
  @SlashGroup("clear", "configuration")
  @Guard(NotOwner, GuildExists)
  async clearAlertChannel (
    interaction: ChatInputCommandInteraction
  ) {
    await interaction.deferReply({
      ephemeral: true
    })
    await Database.Db.guild.update({
      where: {
        guildid: interaction.guild?.id!
      },
      data: {
        alertChannel: null
      }
    }).then(async () => {
      const e = new SuccessEmbed(interaction.guild?.id)
      e.setDescription(await (await e.translation).get("cmd.config.alertchannel.clear.success.alertchannel-cleared"), true)
      return await interaction.editReply({
        embeds: [e]
      })
    }).catch(() => {})
  }

  @Slash({
    name: "setup",
    description: "Set up the guild."
  })
  @SlashGroup("configuration")
  @Guard(NotOwner)
  async setupGuild(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({
      ephemeral: true
    })

    if((await Database.Db.guild.count({ where: { guildid: interaction.guild?.id! } })) > 0) {
      const e = new ErrorEmbed(interaction.guild?.id)
      e.setDescription(await (await e.translation).get("cmd.config.setup.error.guild-exists"), true)
      return await interaction.editReply({
        embeds: [e]
      })
    }

    await APIGuild.createGuild(interaction.guild?.id!).then(async () => {
      const e = new SuccessEmbed(interaction.guild?.id)
      e.setDescription(await (await e.translation).get("cmd.config.setup.success"), true)
      return await interaction.editReply({
        embeds: [e]
      })
    }).catch(() => {})
  }

  // TODO: Add language chooser or set it to guild's language

  @Slash({
    name: "language",
    description: "Choose a language"
  })
  @SlashGroup("configuration")
  @Guard(NotOwner, GuildExists)
  async languageChooser(
    interaction: ChatInputCommandInteraction
  ) {
    await interaction.deferReply()

    const embed = new NeutralEmbed(interaction.guild?.id)
    embed.setDescription(await (await embed.translation).get("cmd.config.language"))

    const reactheremebed = new NeutralEmbed(interaction.guild?.id)
    reactheremebed.setDescription(await (await reactheremebed.translation).get("cmd.config.language.react-here"))

    interaction.editReply({
      embeds: [embed]
    })

    const flagregex = /[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/

    const collectorFilter = (reaction: MessageReaction, user: User) => {
      return flagregex.test(reaction.emoji.name!) && user.id === interaction.user.id;
    };

    const message = await interaction.channel?.send({
      embeds: [reactheremebed]
    })

    const collector = message?.createReactionCollector({
      filter: collectorFilter,
      max: 1,
      maxEmojis: 1,
      time: 60000
    })

    collector?.on("collect", async (reaction, _user) => {
      const lang = LanguageFlags[reaction.emoji.name!]
      if(!lang) return message?.reply({
        content: await (await new Translation().init(await Translation.getGuildLangCode(interaction.guild?.id!))).get("cmd.config.language.no-translation")
      })

      await APIGuild.setLanguage(interaction.guild?.id!, lang)
        .catch(() => {return})
        .then(async () => {
          const langSetEmbed = new SuccessEmbed(interaction.guild?.id)
          langSetEmbed.setDescription((await (await langSetEmbed.translation).get("cmd.config.language.set"))
            .replace("{FLAG}", await (await langSetEmbed.translation).get("flag")))

          await message?.reply({
            embeds: [langSetEmbed]
          })
        })

      collector.stop("flag")
    })

    collector?.on("end", async () => {
      if(collector.endReason == "limit" || collector.endReason == "flag") return
      await interaction.followUp({
        content: await (await new Translation().init(await Translation.getGuildLangCode(interaction.guild?.id!))).get("cmd.config.language.time-is-up")
      })
      collector.stop("time")
    })
  }
}
