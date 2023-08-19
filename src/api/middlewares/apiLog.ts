import { NextFunction, Request, Response } from "express";
import { Database } from "../../db.js";
import { dbSettings, logger } from "../../config.js";
import { getUserIdByToken } from "./auth.js";
import { DBApiAction } from "../../db/connector.js";
import { RumcajsId } from "../../misc/id.js";

export const apiLogMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  //logger.verbose("Hit");
  let data: {
    id: string, ip: string, method: string, apiUserId: string, path: string, data: string | {body: string, headers?: string}
  } = {
    id: RumcajsId.generateId(),
    ip: req.ip,
    method: req.method,
    apiUserId: getUserIdByToken(req.headers.authorization!)! as string,
    path: req.url,
    data: {
      body: req.body,
    }
  }
  if(dbSettings.provider == "sqlite") {
    let sqlitedata = data;
    sqlitedata.data = JSON.stringify({
      body: req.body,
    })

    await Database.Db.apiAction.create({
      data: sqlitedata as DBApiAction
    })
  } else {
    await Database.Db.apiAction.create({
      data: data as DBApiAction
    })
  }
  next();
}
