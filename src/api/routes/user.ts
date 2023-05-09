import { User as DBUser } from "@prisma/client";
import { ObjectId } from "bson";
import { Request, Response } from "express";
import { Database } from "../../db.js";
import { servererror } from "../apimessg.js";
import Route from "../decorator.js";
import { Logger } from "../../logger.js";

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
    path: "/dusers/:id/points"
  })
  async getDUserPoints(req: Request, res: Response) {
    if(!req.params.id) return res.status(400).json({code: 9, message: "no userid"})
    const duser = await Database.Db.user.findUnique({
      where: {
        userid: req.params.id
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
    path: "/dusers/:id/points"
  })
  async updateDUserPoints(req: Request, res: Response) {
    if(!req.params.id) return res.status(400).json({code: 9, message: "no userid"})
    if(req.body.points == null || req.body.points == undefined) return res.status(400).json({code: 10, message: "no points in body"})
    const duser = await User.updateUserPoints(req.params.id, req.body.points).catch(() => {
      res.status(404).json({code: 7, message: "Didnt register user yet"})
    })
    res.status(200).json(duser)
  }

  @Route({
    method: "patch",
    path: "/dusers/:id/blocked"
  })
  async DUserSetBlocked(req: Request, res: Response)  {
    if(!req.params.id) return res.status(400).json({code: 9, message: "no userid"})
    if(req.body.blocked == null || req.body.blocked == undefined) return res.status(400).json({code: 10, message: "no blocked in body"})
    const duser = await User.setBlocked(req.params.id, req.body.blocked).catch(() => {
      res.status(404).json({code: 7, message: "Didnt register user yet"})
    })
    res.status(200).json(duser)
  }

  @Route({
    method: "get",
    path: "/dusers/:id/blocked"
  })
  async DUserGetBlocked(req: Request, res: Response)  {
    if(!req.params.id) return res.status(400).json({code: 9, message: "no userid"})
    if(req.body.blocked == null || req.body.blocked == undefined) return res.status(400).json({code: 10, message: "no blocked in body"})
    const duser = await User.isBlocked(req.params.id).catch(() => {
      res.status(404).json({code: 7, message: "Didnt register user yet"})
    })
    res.status(200).json(duser)
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

  static async updateUserPoints(id: string, points: number) {
    return await Database.Db.user.update({
      where: {
        userid: id
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
        id: new ObjectId().toString()
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
        id: new ObjectId().toString()
      }
    }).catch(() => {})
  }

  static async setPoints(userId: string, points: number) {
    if(await Database.Db.user.count({
      where: {
        userid: userId
      }
    }) != 0) return

    return await Database.Db.user.update({
      where: {
        userid: userId
      },
      data: {
        points: points
      }
    }).catch(() => {})
  }

  static async addPoints(userId: string, points: number) {
    const oldPoints = await Database.Db.user.findUnique({
      where: {
        userid: userId
      },
      select: {
        points: true
      }
    }).catch(() => {})

    const updated = await Database.Db.user.update({
      where: {
        userid: userId
      },
      data: {
        points: (oldPoints?.points ?? 0) + points
      }
    }).catch(() => {})

    return updated
  }

  static async isBlocked(userId: string) {
    const user = await Database.Db.user.findUnique({
      where: {
        userid: userId
      }
    }).catch(() => {throw new Error()})
    return user?.blocked
  }

  static async setBlocked(userId: string, blocked: boolean) {
    const user = await Database.Db.user.update({
      where: {
        userid: userId
      },
      data: {
        blocked: blocked
      }
    }).catch(() => {throw new Error()})

    return user?.blocked
  }
}
