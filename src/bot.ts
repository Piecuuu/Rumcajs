import { dirname, importx } from "@discordx/importer"
import { ActivityType, IntentsBitField } from "discord.js"
import { Client } from "discordx"
import { logger } from "./config.js"

export class Bot {
  private static _client: Client

  static get Client(): Client {
    return this._client
  }

  static async start(token: string) {
    const client = new Client({
      intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildIntegrations,
        IntentsBitField.Flags.GuildModeration,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessageReactions,
        IntentsBitField.Flags.AutoModerationExecution
      ],
      botGuilds: [(client) => client.guilds.cache.map((guild) => guild.id)],
      presence: {
        activities: [
          {
            name: "ciebie",
            type: ActivityType.Watching
          }
        ]
      }
    })
    this._client = client

    logger.debug("Registering commands...")
    const folder = dirname(import.meta.url)
    await importx(`${folder}/{events,commands}/**/*.{ts,js}`).then(() => logger.debug("All Files Imported!"));
    logger.debug("Logging in...")
    this._client.login(token)
  }
}
