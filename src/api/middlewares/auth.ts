import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Database } from "../../db.js";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.headers && req.headers.authorization) {
    jwt.verify(req.headers.authorization, process.env.API_SECRET!, (err, decode) => {
      if (err) req["user"] = undefined;
      if(!decode) {
        res.status(400)
          .json({
            code: 2,
            message: "Invalid token provided"
          });
        req["user"] = undefined;
        return
      }

      Database.Db.apiUser.findUnique({
        where: {
          id: decode!["id"]
        }
      })
      .then((user) => {
        req["user"] = user;
        next();
      }).catch((err) => {
        res.status(500)
          .json({
            message: err
          });
        return
      })
    });
  } else {
    req["user"] = undefined;
    res.status(403).json({
      code: 2,
      message: "no token?"
    })
    return
  }
};

export const getUserIdByToken = (token: string) => {
  let a: string | null = null;
  jwt.verify(token, process.env.API_SECRET!, function (err, decode) {
    if(err) throw err;
    if(!decode) {
      a = null;
      return
    }
    return a = decode!["id"];
    /* Database.Db.apiUser.findUnique({
      where: {
        id: decode!["id"]
      }
    })
    .then((user) => {
      return user;
    }).catch((err) => {
      throw err;
    }) */
  })
  return a;
}
