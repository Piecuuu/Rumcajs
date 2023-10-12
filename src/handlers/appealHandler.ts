import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, DMChannel, InteractionType, ModalBuilder, TextChannel, TextInputBuilder, TextInputStyle } from "discord.js";
import { ArgsOf, ButtonComponent, Discord, On } from "discordx";
import { Bot } from "../bot.js";
import { Database } from "../db.js";
import { DBInfraction, DBInfractionAppeal } from "../db/connector.js";
import { NeutralEmbed } from "../misc/embeds.js";
import { RumcajsId } from "../misc/id.js";
import { Translation } from "./lang.js";
import { EventEmitter } from "events";

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
    const deletedmsg = await ((await (new Translation()).init((await Translation.getGuildLangCode(infraction?.guild!)))).get("common.error.invalid-object-id"));
    if(!RumcajsId.isValid(id)) {
      return interaction.reply({
        content: deletedmsg
      });
    }
    if(infraction?.deleted) {
      return interaction.reply({
        content: deletedmsg
      });
    }
    const reasontextmodal = new TextInputBuilder()
      .setLabel(await ((await (new Translation()).init((await Translation.getGuildLangCode(infraction?.guild!)))).get("infraction.appeal.reason")))
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
    if(interaction.type != InteractionType.ModalSubmit) return;
    if(interaction.customId.substring(0, 11) !== "appealmodal") return;
    const id = interaction.customId.substring(11, 11+12);
    const mid = interaction.customId.substring(11+12, 11+12+19);
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
    appealChannel.send({
      embeds: [embed]
    }).catch(() => {});
  }
}

export const appealEmitter = new EventEmitter()
