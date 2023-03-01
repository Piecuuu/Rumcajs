import { importx } from "@discordx/importer"
import { IntentsBitField } from "discord.js"
import { Client } from "discordx"
import { logger } from "./config"

export class Bot {
  public client: Client

  constructor(token: string) {
    const client = new Client({
      intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildIntegrations,
        IntentsBitField.Flags.GuildModeration,
      ],
      botGuilds: [(client) => client.guilds.cache.map((guild) => guild.id)],
    })
    this.client = client

    logger.debug("Registering commands...")
    importx(__dirname + "/{events,commands}/**/*.{ts,js}");
    logger.debug("Logging in...")
    this.client.login(token)
  }
}
