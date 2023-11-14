import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, DMChannel, GuildMember, InteractionType, ModalBuilder, ModalSubmitInteraction, TextChannel, TextInputBuilder, TextInputStyle } from "discord.js";
import { ArgsOf, ButtonComponent, Discord, On } from "discordx";
import { Bot } from "../bot.js";
import { Database } from "../db.js";
import { DBInfraction, DBInfractionAppeal } from "../db/connector.js";
import { NeutralEmbed, userNotAdminEmbed } from "../misc/embeds.js";
import { RumcajsId } from "../misc/id.js";
import { Translation } from "./lang.js";
import { EventEmitter } from "events";
import { PermissionsCheck } from "../misc/permcheck.js";

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
      .setCustomId("appealmodal" + id + interaction.message.id)

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
    const appealModalStr = "appealmodal";
    const appealModalStrLen = appealModalStr.length;
    const idAndappealModelLen = appealModalStrLen+RumcajsId.length;

    interaction = interaction as ButtonInteraction | ModalSubmitInteraction

    const split = interaction.customId.split("_");

    if(interaction.customId.substring(0, appealModalStrLen) === appealModalStr) {
      if(interaction.type != InteractionType.ModalSubmit) return;
      const id = interaction.customId.substring(appealModalStrLen, idAndappealModelLen); // I'm fucking dumb, I just realized i can just split("_") everything and it would be easier...
      const mid = interaction.customId.substring(idAndappealModelLen, idAndappealModelLen+19);
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
          creationdate: new Date()
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
      const id = split[1];
      const appeal = await Database.Db.infractionAppeal.findUnique({
        where: {
          id: id
        }
      });

      Database.Db.member.create({
        data: {
          id: RumcajsId.generateId(),
          blockAuthorId: interaction.user.id,
          guildId: interaction.guildId!,
          userId: appeal?.author!,
          blocked: true
        }
      });
    }
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

    const button = new ButtonBuilder()
      .setLabel(await (await embed.translation).get(""))

    const actionRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(button)

    appealChannel.send({
      embeds: [embed],
      components: [actionRow],
    }).catch(() => {});
  }
}

export const appealEmitter = new EventEmitter()
