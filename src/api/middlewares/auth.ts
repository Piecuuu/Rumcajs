import { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"
import { Database } from "../../db.js"
import { ErrorModel } from "../models.js"

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.headers && req.headers.authorization) {
    jwt.verify(req.headers.authorization, process.env.API_SECRET!, function (err, decode) {
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
          id: decode!["id"] as string
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
