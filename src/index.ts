import { config } from "dotenv"
config()
import { Bot } from "./bot"
import { token } from "./config"

export const { client } = new Bot(token)
