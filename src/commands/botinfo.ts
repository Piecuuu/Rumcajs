import { EmbedBuilder } from "@discordjs/builders";
import { CommandInteraction, Embed, EmbedField } from "discord.js";
import { Discord, Slash } from "discordx";
import { Colors, logger } from "../config.js";
import { creators } from "../types.js"
import * as os from "os"
import getOs from 'getos';
//const { getOs } = pkg;
import osName from "os-name";
import { Format } from "../misc/format.js";
import { SuccessEmbed } from "../misc/embeds.js";
let finished = false
@Discord()
class botInfo {
  @Slash({
    name: "botinfo",
    description: "Displays info of the bot",
  })
  async botinfo(interaction: CommandInteraction) {
    const info: HWSWInfo = await getHWSWInfo() as HWSWInfo

    if(!info) return await interaction.reply({
      content: "Something went wrong...",
      ephemeral: true
    })

    await interaction.deferReply(/* {
      ephemeral: true
    } */)

    //console.log(info)

    //let gosobj: getOS = {} as getOS

    const embed = new SuccessEmbed()
      .setTitle("Bot info")
      .addFields([
        {
          name: "OS",
          value: "\`" + info.osn + "\`",
          inline: true
        },
        {
          name: "OS release",
          value: `\`${info.ver}\``,
          inline: true
        }
      ])
      .setFooter({
        text: `Uptime ${Format.secondsToHms(info.uptime)}`
      })

    if(os.platform() == "linux") {
      getOs(async (err: Error, dist: getOS) => {
        //logger.debug("getos")
        if(err) return await interaction.editReply("Something went wrong...");
        embed.setFields([
          {
            name: "OS",
            value: "\`" + info.osn + "\`",
            inline: true
          },
          {
            name: "Distro",
            value: `\`${dist.dist + " " + dist.release}\``,
            inline: true
          }
        ])
        embed.addFields([
          {
            name: "Arch",
            value: "\`" + info.arch + "\`",
            inline: true
          },
          {
            name: "Memory",
            value: `\`${Format.formatBytes(info.mem - info.freemem)}/${Format.formatBytes(info.mem)}\``,
            inline: true
          },
          {
            name: "CPU",
            value: `\`${info.cpus[0].model.trim()}\``,
            inline: true
          },
        ])
        finished = true
      })
    } else {
      embed.addFields([
        {
          name: "Arch",
          value: "\`" + info.arch + "\`",
          inline: true
        },
        {
          name: "Memory",
          value: `\`${Format.formatBytes(info.mem - info.freemem)}/${Format.formatBytes(info.mem)}\``,
          inline: true
        },
        {
          name: "CPU",
          value: `\`${info.cpus[0].model.trim()}\``,
          inline: true
        },
      ])
      finished = true
    }

    const a = async (emb: EmbedBuilder) => {
      if(!finished) {
        setTimeout(() => {
          a(emb)
        }, 200)
      } else {
        ret(emb)
      }
    }

    const ret = async (emb: EmbedBuilder) => {
      /* emb.addFields([
        {
          name: "Twórcy",
          value: "_ _",
          inline: false
        }
      ])

      emb.addFields(getCreators(Creators)) */
      //logger.debug("sent")
      await interaction.editReply({
        embeds: [emb]
      })
    }

    a(embed)
  }
}

/* const getCreators = (creators: creators): EmbedField[] => {
  let crefields: EmbedField[] = [];
  (Object.entries(creators).filter((creator) => {
    if(creator[1].hidden) return false;
    return true;
  }).map((creator) => {
    crefields.concat({
      name: creator[0],
      value: creator[1].role,
      inline: true
    })
  }))
  return crefields
} */

/* const a = async (info: HWSWInfo) => {
  if(!finished) {
    setTimeout(
      function(){
        a(info);
      },
      200
    );
  } else {
    return info;
  };
} */

export const getHWSWInfo = async (): Promise<HWSWInfo> => {
  let obj: HWSWInfo;
  let gosobj: getOS = {
    os: "",
    dist: "",
    codename: "",
    release: ""
  };
  const osn = osName(os.platform(), os.release())

  /*if(os.platform() === "linux") {
    getOs((err, dist) => {
      if(err) return logger.error("siur nie wiem");
      dist = gosobj
      finished = true
    })
  }*/

  obj = {} as HWSWInfo

  try {
    obj = {
      arch: os.arch(),
      cpus: os.cpus(),
      freemem: os.freemem(),
      mem: os.totalmem(),
      type: os.type(),
      uptime: os.uptime(),
      ver: os.release(),
      osn: osn,
      gosobj: gosobj,
    }
  } catch(err) {
    logger.error((err as Error).message)
    return {} as HWSWInfo;
  }

  return obj
}

/* export const ret = (info: HWSWInfo): HWSWInfo => {
 return info
} */

export interface HWSWInfo {
  arch: string
  type: string
  ver: string
  cpus: os.CpuInfo[]
  mem: number
  freemem: number
  uptime: number,
  osn: string,
  gosobj: getOS
}

interface getOS {
  os: string,
  dist: string,
  codename: string,
  release: string
}
