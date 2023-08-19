import { Bot } from "../../bot.js";
import { GuildMember } from "discord.js";
import { infractionEmitter } from "../../handlers/infractionHandler.js";
import Route from "../decorator.js";
import { Request, Response } from "express";
import { Database } from "../../db.js";
import { RumcajsId } from "../../misc/id.js";
import { Infraction } from "../../controllers/infraction.js";

export class APIInfraction {
  @Route({
    method: "post",
    path: "/infractions"
  })
  async APIPostInfraction(req: Request, res: Response) {
    if(!req.body) return res.status(400).json({code: 69420, message: "no body"})
    await Infraction.add({
      ...req.body,
      id: RumcajsId.generateId()
    })
    res.json({"status": "ok"})
  }

  @Route({
    method: "get",
    path: "/infractions/:id"
  })
  async APIGetInfraction(req: Request, res: Response) {
    if(!req.params.id) return res.status(400).json({code: 69420, message: "no id?"})
    const inf = new Infraction(req.params.id)
    res.json(await inf.fetch())
  }
}
