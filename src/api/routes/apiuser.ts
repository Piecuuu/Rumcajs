import { Request, Response } from "express";
import Route from "../decorator.js";
import { ErrorModel } from "../models.js";
import { Database } from "../../db.js";
import { ObjectId } from "bson";
import jwt from "jsonwebtoken"
import { DBApiUser } from "../../db/connector.js";
import { RumcajsId } from "../../misc/id.js";
import { ApiUser } from "../../controllers/apiuser.js";

export class APIUser {
  @Route({
    method: "get",
    path: "/users"
  })
  async getApiUser(req: Request, res: Response) {
    if(!req.query || !req.query.userid) return res.status(400).json({code: 3, message: "No userid provided"} as ErrorModel)
    const uid = req.query.userid

    const user = await Database.Db.apiUser.findUnique({
      where: {
        id: uid as string
      }
    }).catch(() => {
      res.status(500)
        .json({
          message: "Internal server error"
        });
    })

    res.status(200).json(user)
  }

  @Route({
    method: "post",
    path: "/users"
  })
  async createApiUser(req: Request, res: Response) {
    if(req["user"]["role"] != "admin") return res.status(403).json({code: 5, message: "Not admin"})
    if(!req.body.role) return res.status(400).json({code: 6, message: "no role?"})
    const user = await ApiUser.add({
      role: req.body.role
    } as DBApiUser).catch(() => {
      res.status(500)
        .json({
          message: "Internal server error"
        });
    })

    const token = jwt.sign({
      id: (await user as DBApiUser).id
    }, process.env.API_SECRET!)

    res.status(200).json({...user, token: token})
  }
}
