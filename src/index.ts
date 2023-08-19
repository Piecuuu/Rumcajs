import "./loadEnv.js"
import { Bot } from "./bot.js"
import { isDebug, token } from "./config.js"
import { Database } from "./db.js"
import { Logger } from "./logger.js"
import "./api/server.js"

const bot = Bot

export const exitHandler = async (signal: string = "", code: number = 0, error?: Error): Promise<never> => {
  if(Database.Db) await Database.Db.$disconnect()
  if(error?.stack) Logger.Logger.fatal(error.stack!)
  if(signal == "SIGINT") Logger.Logger.info("  SIGINT RECIEVED -- Exiting")
  if(signal == "SIGQUIT") Logger.Logger.info("  SIGQUIT RECIEVED -- Exiting\n")
  //throw error

  process.exit(code)
}

process.on('exit', exitHandler);

process.on('SIGINT', exitHandler);

process.on('SIGUSR1', exitHandler);
process.on('SIGUSR2', exitHandler);

process.on("unhandledRejection", (r: Error) => {
  if(r) {
    //Logger.Logger.fatal(r.message)
    Logger.Logger.fatal(r.stack!)
  }
  //throw new Error(r.message)
  if(isDebug) exitHandler("", 1, r)
})

const main = async () => {
  await Database.start().catch((r) => {
    exitHandler("", 1, r)
  }).finally(() => {
    bot.start(token)
  })
}

main().then(() => {})
