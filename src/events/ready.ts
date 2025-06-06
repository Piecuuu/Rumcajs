import { Discord, Once } from "discordx"
import { logger } from "../config.js"
import { Bot } from "../bot.js";
import { MitycznyHandler } from "../handlers/mitycznyHandler.js";

@Discord()
class readyEvent {
  @Once({
    event: "ready"
  })
  async ready() {
    await Bot.Client.guilds.fetch().then(() => {
      logger.debug("Guilds fetched.")
    });
    await Bot.Client.initApplicationCommands().then(() => {
      logger.debug("Done registering commands!")
    })

    logger.info(`Logged in as ${Bot.Client.user?.tag} (${Bot.Client.user?.id})`)

    await Bot.Client.guilds.cache.map((guild) => {
      MitycznyHandler.start(guild.id)
    })
  }
}
