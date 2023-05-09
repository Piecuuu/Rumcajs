import "./loadEnv.js"
import { Bot } from "./bot.js"
import { isDebug, token } from "./config.js"
import { Database } from "./db.js"
import { Logger } from "./logger.js"
import "./api/server.js"

const bot = Bot
const db = Database

export const exitHandler = async (code = 0) => {
  await db.Db.$disconnect()
  process.exit(code)
}

process.on('exit', exitHandler);

process.on('SIGINT', exitHandler);

process.on('SIGUSR1', exitHandler);
process.on('SIGUSR2', exitHandler);

process.on("unhandledRejection", (r: Error) => {
  Logger.Logger.fatal(r.message)
  if(isDebug) exitHandler(1)
})

const main = async () => {
  await db.start().catch(() => {
    exitHandler(1)
  }).finally(() => {
    bot.start(token)
  })
}

main().then(() => {})
