import { Discord, Once } from "discordx"
import { client } from "../index.js"
import { logger } from "../config.js"

@Discord()
class readyEvent {
  @Once({
    event: "ready"
  })
  async ready() {
    await client.guilds.fetch().then(() => {
      logger.debug("Guilds fetched.")
    });
    await client.initApplicationCommands({
      /*guild: {
        disable: {
          add: true,
          delete: true,
          update: true
        }
      },*/
      global: {
        disable: {
          add: true,
          delete: true,
          update: true
        }
      },
    }).then(() => {
      logger.debug("Done registering commands!")
    })

    logger.info(`Logged in as ${client.user?.tag} (${client.user?.id})`)
  }
}
