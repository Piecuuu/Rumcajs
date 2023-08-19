import {
  ActionRowBuilder, CommandInteraction,
  EmbedBuilder, ModalActionRowComponentBuilder,
  ModalBuilder,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle
} from "discord.js";
import { Discord, ModalComponent, Slash } from "discordx";

@Discord()
class evaluate {
  @Slash({name: "evaluate", description: "Dev only", guilds: ["1105815068727312415"]})
  async eval (
/*     @SlashOption({
      name: "ephemeral",
      required: false,
      type: ApplicationCommandOptionType.Boolean
    })
    ephemeral: boolean, */
    interaction: CommandInteraction
  ) {

    if(interaction.member?.user.id != "633313654283960330") {
      console.log(interaction.user.tag + " tried.")
      return await interaction.reply({content: "No Permissions", ephemeral: false})
    }

    const codeInput = new TextInputBuilder()
      .setCustomId("evalModalCodeInput")
      .setLabel("Code")
      .setStyle(TextInputStyle.Paragraph)

    const codeActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>()
      .addComponents(codeInput)

    const modal = new ModalBuilder()
      .setCustomId("evalModal")
      .setTitle("Evaluate")
      .addComponents(codeActionRow)

    await interaction.showModal(modal)
  }

  @ModalComponent()
  async evalModal (
    interaction: ModalSubmitInteraction
  ) {
    await interaction.deferReply({
      ephemeral: true
    })
    if(interaction.member?.user.id != "633313654283960330") {
      console.log(interaction.user.tag + " tried.")
    }

    const [evalCode] = ["evalModalCodeInput"].map((id) =>
      interaction.fields.getTextInputValue(id)
    );

    const emb = new EmbedBuilder()
      .setDescription(`Evaled\n\`\`\`js\n${evalCode.trim()}\`\`\``)
      .setColor('Green')
    try {
      const ev = eval("(function() {" + evalCode + "}());")
      if(ev) {
        emb.setDescription(`Evaled\n\`\`\`js\n${evalCode.trim()}\`\`\` \`\`\`${ev}\`\`\``)
      }
      await interaction.editReply({embeds: [emb]})
    }
    catch(e) {
      const eerr = new EmbedBuilder()
        .setDescription(`Eval Error\n\`\`\`js\n${evalCode.trim()}\`\`\`\nError:\`\`\`${e}\`\`\``)
        .setColor('Red')

      try {
        await interaction.editReply({embeds: [eerr]})
      }
      catch(e) {
        try {
          await interaction.editReply({content: `Eval Error\n\`\`\`js\n${evalCode.trim()}\`\`\`\nError:\`\`\`${e}\`\`\``})
        }
        catch(e) {
          console.error(e)
        }
        console.error(e)
      }

    console.error(e)

    }
  }
}

/* function random(min: number, max: number): number {
  if(min <= 0) {
    return Math.floor(Math.random() * (max + 1))
  }
  return Math.floor(Math.random() * (max + 1)) + min
} */

/* import("../handlers/lang.js").then(async lang => {
  const t = new lang.Translation(await lang.Translation.getGuildLangCode(interaction.guild.id))

  console.log(t.get("error.target-has-higher-ranks"))
})
 */

// average timeuntil
/*(async () => {
  const db = (await import("../db.js")).Database.Db;
  const infs = await db.infraction.findMany({
    where: {
      author: "633313654283960330"
    }
  });

  const f = infs.filter((i) => i.timeuntil !== null);
  const times = f.map((i) => i.timeuntil)
  const avg = times.reduce((total, time) => total + time, 0) / times.length

  interaction.channel.send({content: Math.floor(avg / 3600).toString()});
})()*/
