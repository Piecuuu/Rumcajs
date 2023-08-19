import { Request, Response } from "express";
import Route from "../decorator.js";
import { Bot } from "../../bot.js";
import { DApplicationCommand } from "discordx";
import { readFile } from "fs/promises";
import path from "path";

export class APIPing {
  @Route({
    method: "get",
    path: "/ping"
  })
  async apiPing(req: Request, res: Response) {
/*     try { */
    const slashes = Bot.Client.applicationCommands.map((slash: DApplicationCommand) => {
      return slash.name
    });
    const file = await readFile("package.json");
    const pkg = JSON.parse(file.toString());

    res.status(200).json({
      status: "ok",
      commandsLoaded: slashes,
      clientId: Bot.Client.user?.id,
      szczurVersion: pkg.version
    })
/*     } catch(err) {
      res.status(500).json({
        error: "Internal Server Error"
      })
      return
    } */
  }
}
