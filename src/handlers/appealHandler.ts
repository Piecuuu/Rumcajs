import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, DMChannel, EmbedBuilder, GuildMember, InteractionType, ModalBuilder, ModalSubmitInteraction, TextChannel, TextInputBuilder, TextInputStyle } from "discord.js";
import { ArgsOf, ButtonComponent, Discord, On } from "discordx";
import { Bot } from "../bot.js";
import { Database } from "../db.js";
import { DBInfraction, DBInfractionAppeal } from "../db/connector.js";
import { NeutralEmbed, userNotAdminEmbed } from "../misc/embeds.js";
import { RumcajsId } from "../misc/id.js";
import { Translation } from "./lang.js";
import { EventEmitter } from "events";
import { PermissionsCheck } from "../misc/permcheck.js";
import { InfractionType } from "../types.js";

const enum AppealStatus {
  Open = 0b00,
  Denied = 0b01,
  Approved = 0b10,
}

@Discord()
export class AppealHandler {
  @ButtonComponent({
    id: "appealbutton"
  })
  async appealHandlerButton(interaction: ButtonInteraction) {
    //await interaction.deferReply();
    const id = interaction.message.embeds[0].footer?.text!;
    const infraction = await Database.Db.infraction.findUnique({
      where: {
        id: id
      }
    })
    const isBlocked = (await Database.Db.member.findUnique({
      where: {
        userId: interaction.user.id,
        guildId: infraction?.guild
      },
      select: {
        blocked: true
      }
    }))?.blocked;
    const translation = (await (new Translation()).init((await Translation.getGuildLangCode(infraction?.guild!))));
    if(isBlocked) {
      return await interaction.reply(await translation.get("infraction.appeal.error.user-blocked"))
    }
    if(!RumcajsId.isValid(id)) {
      return interaction.reply({
        content: await translation.get("common.error.invalid-object-id")
      });
    }
    if(infraction?.deleted) {
      return interaction.reply({
        content: await translation.get("common.error.invalid-object-id")
      });
    }
    const reasontextmodal = new TextInputBuilder()
      .setLabel(await translation.get("infraction.appeal.reason"))
      .setCustomId("reason")
      .setRequired(true)
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(1750)
      .setMinLength(20);

    const ar = new ActionRowBuilder<TextInputBuilder>()
      .addComponents(reasontextmodal);

    const modal = new ModalBuilder()
      .addComponents([ar])
      .setTitle("Appeal")
      .setCustomId(`appealmodal_${infraction?.id}_${interaction.message.id}`)

    await interaction.showModal(modal)
  }

  static async createAppealActionRow(guildid: string): Promise<ActionRowBuilder<ButtonBuilder> | null> {
    const guild = await Database.Db.guild.findUnique({
      where: {
        guildid: guildid
      }
    })

    if(!guild?.appealChannel) return null;
    const btn = new ButtonBuilder()
      .setCustomId("appealbutton")
      .setStyle(ButtonStyle.Primary)
      .setLabel(await (await (new Translation()).init(await Translation.getGuildLangCode(guildid))).get("infraction.dm.appeal.button"));

    const ar = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(btn);
    return ar
  }

  @On({
    event: "interactionCreate"
  })
  async appealModal(
    [interaction]: ArgsOf<"interactionCreate">
  ) {
    if(!((interaction.type == InteractionType.ModalSubmit) || (interaction.type == InteractionType.MessageComponent))) return;

    const split = interaction.customId.split("_");
    // TODO: Check if already sent (maybe grey out buttons)

    if(split[0] === "appealmodal") {
      if(interaction.type != InteractionType.ModalSubmit) return;
      // Haha, I implemented it anyways...
      const id = split[1];
      const mid = split[2];
      const message = await (await Bot.Client.channels.fetch(interaction.channelId!) as DMChannel).messages.fetch(mid);
      const infraction = await Database.Db.infraction.findUnique({
        where: {
          id: id
        }
      })
      const ifap = await Database.Db.infractionAppeal.create({
        data: {
          author: interaction.user.id,
          guild: infraction?.guild!,
          infid: infraction?.id!,
          reason: interaction.fields.getTextInputValue("reason"),
          type: infraction?.type!,
          dmchannel: interaction.channelId!,
          dmmessageid: mid,
          id: RumcajsId.generateId(),
          creationdate: new Date(),
          status: AppealStatus.Open
        }
      });
      const newbtn = await AppealHandler.createAppealActionRow(infraction?.guild!);
      if(newbtn === null) return;
      newbtn.components[0].setDisabled(true);
      await message?.edit({
        components: [newbtn]
      })
      await interaction.reply({
        content: await (await (new Translation()).init(await Translation.getGuildLangCode(infraction?.guild!))).get("infraction.dm.appeal.sent")
      })
      this.sendToAdmins(ifap, infraction!);
    } else if(split[0] === "block") {
      if(!(await PermissionsCheck.isAdmin(interaction.member as GuildMember))) {
        return await interaction.reply({
          embeds: [await userNotAdminEmbed(interaction.guild?.id!)]
        })
      }
      await interaction.deferReply({
        ephemeral: true
      })
      const id = split[1];
      const appeal = await Database.Db.infractionAppeal.findUnique({
        where: {
          id: id
        }
      });
      const translation = await (await (new Translation()).init(await Translation.getGuildLangCode(appeal?.guild!)));
      if(interaction.user.id == appeal?.author) {
        return await interaction.editReply({
          content: await translation.get("infraction.appeal.error.self-moderate")
        })
      }
      let shouldReturn = false;
      const members = interaction.guild?.members;
      const member = members?.cache.has(appeal?.author!) ? members?.cache.get(appeal?.author!) : await members?.fetch(appeal?.author!).catch(async () => {
        shouldReturn = true;
        throw await interaction.editReply({
          content: await translation.get("error.no-member-on-server")
        })
      });
      if(shouldReturn) return;
      if(!(await PermissionsCheck.canMemberPunishOtherMember(interaction.member as GuildMember, member!))) {
        return await interaction.editReply({
          content: await translation.get("infraction.appeal.error.moderate-higher-rank")
        })
      }
      await Database.Db.infractionAppeal.update({
        where: {
          id
        },
        data: {
          status: AppealStatus.Denied,
          moderator: interaction.user.id
        }
      });

      const buttons: ButtonBuilder[] = (await this.getButtons(translation, appeal as DBInfractionAppeal)).map<ButtonBuilder>(button => {
        return button.setDisabled(true);
      });
      const actionrow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(buttons);

      await interaction.message?.edit({
        components: [actionrow],
        embeds: [new EmbedBuilder(interaction.message?.embeds[0].toJSON()).setFooter({text: `${await translation.get("infraction.dm.appeal.denied-by")} ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({extension: "webp", size: 128})})]
      });

      await interaction.editReply({
        content: await translation.get("infraction.appeal.embed.blocked")
      })

      member?.send({
        content: (await translation.get("infraction.dm.appeal.response")).replace("{ADMINRESPONSE}", await translation.get("infraction.dm.appeal.denied")),
        reply: {
          messageReference: appeal?.dmmessageid!
        }
      }).catch(() => {})
      if(await Database.Db.member.count({ where: { userId: appeal?.author, guildId: appeal?.guild }}) <= 0) {
        await Database.Db.member.create({
          data: {
            id: RumcajsId.generateId(),
            blockAuthorId: interaction.user.id,
            guildId: interaction.guildId!,
            userId: appeal?.author!,
            blocked: true
          }
        });
        return;
      }

      await Database.Db.member.update({
        where: {
          userId: appeal?.author,
          guildId: appeal?.guild,
        },
        data: {
          blockAuthorId: interaction.user.id,
          blocked: true,
        }
      });
    } else if(split[0] === "deny") {
      if(!(await PermissionsCheck.isAdmin(interaction.member as GuildMember))) {
        return await interaction.reply({
          embeds: [await userNotAdminEmbed(interaction.guild?.id!)]
        })
      }
      await interaction.deferReply({
        ephemeral: true
      })
      const id = split[1];
      const appeal = await Database.Db.infractionAppeal.update({
        where: {
          id
        },
        data: {
          status: AppealStatus.Denied,
          moderator: interaction.user.id
        }
      })
      const translation = await (await (new Translation()).init(await Translation.getGuildLangCode(appeal?.guild!)));
      if(interaction.user.id == appeal?.author) {
        return await interaction.editReply({
          content: await translation.get("infraction.appeal.error.self-moderate")
        })
      }
      let shouldReturn = false;
      const members = interaction.guild?.members;
      const member = members?.cache.has(appeal?.author!) ? members?.cache.get(appeal?.author!) : await members?.fetch(appeal?.author!).catch(async () => {
        shouldReturn = true;
        throw await interaction.editReply({
          content: await translation.get("error.no-member-on-server")
        })
      });
      if(shouldReturn) return;
      if(!(await PermissionsCheck.canMemberPunishOtherMember(interaction.member as GuildMember, member!))) {
        return await interaction.editReply({
          content: await translation.get("infraction.appeal.error.moderate-higher-rank")
        })
      }
      const buttons: ButtonBuilder[] = (await this.getButtons(translation, appeal as DBInfractionAppeal)).map<ButtonBuilder>(button => {
        return button.setDisabled(true);
      });
      const actionrow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(buttons);

      await interaction.message?.edit({
        components: [actionrow],
        embeds: [new EmbedBuilder(interaction.message?.embeds[0].toJSON()).setFooter({text: `${await translation.get("infraction.dm.appeal.denied-by")} ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({extension: "webp", size: 128})})]
      });
      await interaction.editReply({
        content: await translation.get("infraction.appeal.embed.denied")
      })
      member?.send({
        content: (await translation.get("infraction.dm.appeal.response")).replace("{ADMINRESPONSE}", await translation.get("infraction.dm.appeal.denied")),
        reply: {
          messageReference: appeal.dmmessageid
        }
      }).catch(() => {})
    } else if(split[0] === "accept") {
      if(!(await PermissionsCheck.isAdmin(interaction.member as GuildMember))) {
        return await interaction.reply({
          embeds: [await userNotAdminEmbed(interaction.guild?.id!)]
        })
      }
      await interaction.deferReply({
        ephemeral: true
      })
      const id = split[1];
      const appeal = await Database.Db.infractionAppeal.update({
        where: {
          id
        },
        data: {
          status: AppealStatus.Approved,
          moderator: interaction.user.id
        }
      })
      const translation = await (await (new Translation()).init(await Translation.getGuildLangCode(appeal?.guild!)));
      if(interaction.user.id == appeal?.author) {
        return await interaction.editReply({
          content: await translation.get("infraction.appeal.error.self-moderate")
        })
      }
      let shouldReturn = false;
      const members = interaction.guild?.members;
      const member = members?.cache.has(appeal?.author!) ? members?.cache.get(appeal?.author!) : await members?.fetch(appeal?.author!).catch(async () => {
        shouldReturn = true;
        throw await interaction.editReply({
          content: await translation.get("error.no-member-on-server")
        })
      });
      if(shouldReturn) return;
      if(!(await PermissionsCheck.canMemberPunishOtherMember(interaction.member as GuildMember, member!))) {
        return await interaction.editReply({
          content: await translation.get("infraction.appeal.error.moderate-higher-rank")
        })
      }
      const inf = await Database.Db.infraction.findUnique({where: {id: appeal.infid}});
      await Database.Db.infraction.update({
        where: {
          id: appeal.infid
        },
        data: {
          deleted: true,
          reason: `${inf?.reason} | Appealed ${appeal.id}`,
        }
      })

      if(inf?.type == InfractionType.Mute) {
        if(member?.isCommunicationDisabled()) {
          const currentTime = Date.now();
          const timeoutExpiration = inf.creationdate.getTime() + inf.timeuntil! * 1000;

          if(currentTime < timeoutExpiration) {
            member?.timeout(1, `Unmuted due to appeal ${appeal.id}`);
          }
        }
      }

      const buttons: ButtonBuilder[] = (await this.getButtons(translation, appeal as DBInfractionAppeal)).map<ButtonBuilder>(button => {
        return button.setDisabled(true);
      });
      const actionrow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(buttons);

      await interaction.message?.edit({
        components: [actionrow],
        embeds: [new EmbedBuilder(interaction.message?.embeds[0].toJSON()).setFooter({text: `${await translation.get("infraction.dm.appeal.accepted-by")} ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({extension: "webp", size: 128})})]
      });

      await interaction.editReply({
        content: await translation.get("infraction.appeal.embed.accepted"),
      })
      member?.send({
        content: (await translation.get("infraction.dm.appeal.response")).replace("{ADMINRESPONSE}", await translation.get("infraction.dm.appeal.accepted")),
        reply: {
          messageReference: appeal.dmmessageid
        }
      }).catch(() => {})
    }
    /**
     * 00 - Open
     * 01 - Denied
     * 10 - Approved
     * 11 - Unused
     */
  }

  async sendToAdmins(appeal: DBInfractionAppeal, infraction: DBInfraction) {
    const gld = await Database.Db.guild.findUnique({
      where: {
        guildid: infraction.guild
      }
    })
    const appealChannel = await Bot.Client.channels.fetch(gld?.appealChannel!) as TextChannel;
    const embed = new NeutralEmbed(infraction.guild)
    embed.setFooter({
      text: "Appeal ID: " + appeal.id
    })
    embed.setTitle(await (await embed.translation).get("infraction.appeal.embed.title"))
    embed.addFields([
        {
          name: await (await embed.translation).get("cmd.infraction.get.field.user"),
          value: "<@"+appeal.author+">",
          inline: true
        },
        {
          name: await (await embed.translation).get("cmd.infraction.get.field.id"),
          value: "`"+infraction.id+"`",
          inline: true
        },
        {
          name: await (await embed.translation).get("cmd.infraction.get.field.credate"),
          value: `<t:${Math.floor(infraction.creationdate.getTime() / 1000)}:f>`,
          inline: true
        },
        {
          name: await (await embed.translation).get("cmd.infraction.get.field.type"),
          value: "`"+infraction.type+"`",
          inline: true
        },
        {
          name: await (await embed.translation).get("cmd.infraction.get.field.reason"),
          value: "```"+appeal.reason+"```",
          inline: false
        }
      ])

    const actionRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(await this.getButtons(await embed.translation, appeal))

    appealChannel.send({
      embeds: [embed],
      components: [actionRow],
    });
  }

  async getButtons(translation: Translation, appeal: DBInfractionAppeal): Promise<ButtonBuilder[]> {
    const buttonaccept = new ButtonBuilder()
      .setLabel(await (await translation).get("infraction.appeal.button.accept"))
      .setStyle(ButtonStyle.Success)
      .setCustomId(`accept_${appeal.id}`);

    const buttondeny = new ButtonBuilder()
      .setLabel(await (await translation).get("infraction.appeal.button.deny"))
      .setStyle(ButtonStyle.Danger)
      .setCustomId(`deny_${appeal.id}`);

    const buttonblock = new ButtonBuilder()
      .setLabel(await (await translation).get("infraction.appeal.button.block"))
      .setStyle(ButtonStyle.Secondary)
      .setCustomId(`block_${appeal.id}`);

    return [buttonaccept, buttondeny, buttonblock];
  }
}

export const appealEmitter = new EventEmitter()
