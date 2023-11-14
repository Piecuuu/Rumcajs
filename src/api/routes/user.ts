import { ObjectId } from "bson";
import { Request, Response } from "express";
import { Database } from "../../db.js";
import { servererror } from "../apimessg.js";
import Route from "../decorator.js";
import { Logger } from "../../logger.js";
import { Bot } from "../../bot.js";
import DBConnector, { DBUser } from "../../db/connector.js";
import { RumcajsId } from "../../misc/id.js";

export class User {
  @Route({
    method: "get",
    path: "/dusers/:id"
  })
  async getDUser(req: Request, res: Response) {
    if(!req.params.id) return res.status(400).json({code: 6, message: "no userid"})
    const duser = await Database.Db.user.findUnique({
      where: {
        userid: req.params.id
      }
    }).catch(() => {res.status(404).json({code: 7, message: "Didnt register user yet"})})
    res.status(200).json(duser)
  }

  @Route({
    method: "post",
    path: "/dusers/"
  })
  async createDUser(req: Request, res: Response) {
    //if(!req.params.id) return res.status(400).json({code: 9, message: "no userid"})
    if(!req.body) return res.status(400).json({code: 6, message: "no body"})

    const duser = User.customCreateUser({
      id: new ObjectId().toString(),
      ...req.body
    })
    if(!duser) return res.status(500).json(servererror())
    res.status(200).json(duser)
  }

  @Route({
    method: "delete",
    path: "/dusers/:id"
  })
  async deleteDUser(req: Request, res: Response) {
    if(!req.params.id) return res.status(400).json({code: 9, message: "no userid"})
    await Database.Db.user.delete({
      where: {
        userid: req.params.id
      }
    }).catch(() => {res.status(404).json({code: 7, message: "Didnt register user yet"})})
    res.status(200).json({})
  }

  @Route({
    method: "patch",
    path: "/dusers/:id"
  })
  async updateDUser(req: Request, res: Response) {
    if(!req.params.id) return res.status(400).json({code: 9, message: "no userid"})
    if(!req.body) return res.status(400).json({code: 10, message: "no points in body"})
    const duser = await User.modifyUser(req.params.id, req.body).catch(() => {
      res.status(404).json({code: 7, message: "Didnt register user yet"})
    })
    res.status(200).json(duser)
  }

  @Route({
    method: "get",
    path: "/dusers/:guildid/:id/points"
  })
  async getDUserPoints(req: Request, res: Response) {
    if(!req.params.id) return res.status(400).json({code: 9, message: "no userid"})
    const duser = await Database.Db.member.findUnique({
      where: {
        userId: req.params.id,
        guildId: req.params.guildid
      },
      select: {
        points: true
      }
    }).catch(() => {
      res.status(404).json({code: 7, message: "Didnt register user yet"})
      return
    })

    res.status(200).json(duser)
  }
  @Route({
    method: "patch",
    path: "/dusers/:guildid/:id/points"
  })
  async updateDUserPoints(req: Request, res: Response) {
    if(!req.params.id) return res.status(400).json({code: 9, message: "no userid"})
    if(req.body.points == null || req.body.points == undefined) return res.status(400).json({code: 10, message: "no points in body"})
    const duser = await User.updateUserPoints(req.params.id, req.params.guildid, req.body.points).catch(() => {
      res.status(404).json({code: 7, message: "Didnt register user yet"})
    })
    res.status(200).json(duser)
  }

  @Route({
    method: "patch",
    path: "/dusers/:guildid/:id/blocked"
  })
  async DUserSetBlocked(req: Request, res: Response)  {
    if(!req.params.id) return res.status(400).json({code: 9, message: "no userid"})
    if(req.body.blocked == null || req.body.blocked == undefined) return res.status(400).json({code: 10, message: "no blocked in body"})
    const duser = await User.setBlocked(req.params.id, req.params.guildid, req.body.blocked).catch(() => {
      res.status(404).json({code: 7, message: "Didnt register user yet"})
    })
    res.status(200).json(duser)
  }

  @Route({
    method: "get",
    path: "/dusers/:guildid/:id/blocked"
  })
  async DUserGetBlocked(req: Request, res: Response)  {
    if(!req.params.id) return res.status(400).json({code: 9, message: "no userid"})
    if(req.body.blocked == null || req.body.blocked == undefined) return res.status(400).json({code: 10, message: "no blocked in body"})
    const duser = await User.isBlocked(req.params.id, req.params.guildid).catch(() => {
      res.status(404).json({code: 7, message: "Didnt register user yet"})
    })
    res.status(200).json(duser)
  }

  @Route({
    method: "get",
    path: "/top/:guildid/:limit"
  })
  async getTop(req: Request, res: Response) {
    if(!req.params.limit) return res.status(400).json({code: 6969, message: "no limit?"})
    const top = await Database.Db.member.findMany({
      orderBy: {
        points: "desc"
      },
      where: {
        NOT: {
          OR: [
            {
              points: {
                equals: 0
              }
            },
            {
              userId: {
                equals: Bot.Client.user?.id
              }
            }
          ]
        },
        guildId: {
          equals: req.params.guildid
        }
      },
      take: parseInt(req.params.limit)
    })

    res.status(200).json(top)
  }

  static async getUser(id: string) {
    return await Database.Db.user.findUnique({
      where: {
        userid: id
      }
    })
  }

  static async modifyUser(id: string, data: User) {
    return await Database.Db.user.update({
      where: {
        userid: id
      },
      data: data
    }).catch((err) => {throw new Error(err.message)})
  }

  static async updateUserPoints(userId: string, guildId: string, points: number) {
    return await Database.Db.member.update({
      where: {
        userId: userId,
        guildId: guildId,
      },
      data: {
        points: points
      }
    })
  }

  static async createUser(userId: string) {
    return await Database.Db.user.create({
      data: {
        points: 0,
        userid: userId,
        id: RumcajsId.generateId()
      }
    }).catch(() => {})
  }

  static async customCreateUser(data: DBUser) {
    return await Database.Db.user.create({
      data: data
    }).catch(() => {})
  }

  static async createUserIfDoesntExist(userId: string) {
    if(await Database.Db.user.count({
      where: {
        userid: userId
      }
    }) != 0) return null

    return await Database.Db.user.create({
      data: {
        points: 0,
        userid: userId,
        id: RumcajsId.generateId()
      }
    }).catch(() => {})
  }

  static async setPoints(userId: string, guildId: string, points: number) {
    if(await Database.Db.member.count({
      where: {
        userId: userId,
        guildId: guildId,
      }
    }) == 0) return

    return await Database.Db.member.update({
      where: {
        userId: userId,
        guildId: guildId
      },
      data: {
        points: points
      }
    }).catch(() => {})
  }

  static async addPoints(userId: string, guildId: string, points: number) {
    const updated = await Database.Db.member.update({
      where: {
        userId: userId,
        guildId: guildId,
      },
      data: {
        points: {
          increment: points
        }
      }
    }).catch(() => {})

    return updated
  }

  static async subPoints(userId: string, guildId: string, points: number) {
    const updated = await Database.Db.member.update({
      where: {
        userId: userId,
        guildId: guildId,
      },
      data: {
        points: {
          decrement: points
        }
      }
    }).catch(() => {})

    return updated
  }

  static async isBlocked(userId: string, guildId: string) {
    const user = await Database.Db.member.findUnique({
      where: {
        userId: userId,
        guildId: guildId,
      }
    }).catch(() => {throw new Error()})
    return user?.blocked
  }

  static async setBlocked(userId: string, guildId: string, blocked: boolean) {
    const user = await Database.Db.member.update({
      where: {
        userId: userId,
        guildId: guildId,
      },
      data: {
        blocked: blocked
      }
    }).catch(() => {throw new Error()})

    return user?.blocked
  }
}
