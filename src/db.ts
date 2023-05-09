import { PrismaClient } from "@prisma/client";
import { isDebug, logger } from "./config.js";
import { exitHandler } from "./index.js";

export class Database {
  private static _db: PrismaClient

  static get Db() {
    return this._db
  }

  static async start() {
    this._db = new PrismaClient((isDebug ? {
      log: [
        {
          emit: "stdout",
          level: "query"
        },
        {
          emit: "stdout",
          level: "error"
        },
        {
          emit: "stdout",
          level: "info"
        },
        {
          emit: "stdout",
          level: "warn"
        }
      ]
    } : undefined))
    this._db.$connect().catch((err) => {
      logger.fatal(`Cannot connect to the database!\n${err}`)
      exitHandler(1)
    })
    return this._db
  }
}
