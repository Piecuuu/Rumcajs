import "./loadEnv.js"
import { Bot } from "./bot.js"
import { token } from "./config.js"

const bot = Bot
bot.start(token)
export const client = bot.Client
