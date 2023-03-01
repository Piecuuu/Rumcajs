import { Discord, Once } from "discordx"
import { client } from ".."
import { logger } from "../config"

@Discord()
class readyEvent {
  @Once({
    event: "ready"
  })
  async ready() {
    await client.guilds.fetch().then(() => {
      logger.verbose("Guilds fetched.")
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
      logger.info("Done registering commands!")
    })

    logger.info(`Logged in as ${client.user?.tag} (${client.user?.id})`)
  }
}
