import { dbSettings, isDebug, logger } from "./config.js";
import { exitHandler } from "./index.js";
import { DBProvider } from "./types.js";
import DBConnector from "./db/connector";

export class Database {
  private static _db: DBConnector

  static get Db() {
    return this._db
  }

  static async start() {
    const dbOpt = isDebug ? {
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
    } : undefined


    switch(this.dbProvider) {
      case "mongodb": {
        this._db = new (await import("../prisma/gen/mongo/index.js")).PrismaClient(dbOpt as any) as DBConnector
        break
      }
      case "sqlite": {
        this._db = new (await import("../prisma/gen/sqlite/index.js")).PrismaClient(dbOpt as any) as DBConnector
        break
      }
      case "mysql": {
        this._db = new (await import("../prisma/gen/mysql/index.js")).PrismaClient(dbOpt as any) as DBConnector
        break
      }
      case "postgresql": {
        this._db = new (await import("../prisma/gen/pg/index.js")).PrismaClient(dbOpt as any) as DBConnector
        break
      }
    }

    /* this._db = new PrismaClient((isDebug ? {
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
    } : undefined)) */
    this._db.$connect().catch((err) => {
      logger.fatal(`Cannot connect to the database!\n${err}`)
      exitHandler("", 1)
    })
    return this._db
  }



  private static get dbProvider(): DBProvider {
    return dbSettings.provider
  }
}

/* export let db: MongoConnector | PGConnector; */
