import { Database } from "../db";
import { DBUser } from "../db/connector.js";
import { RumcajsId } from "../misc/id";
import { Model } from "./model.js";

export class User extends Model {
  static async add(user: DBUser) {
    return await Database.Db.user.create({
      data: {
        ...user,
        id: RumcajsId.generateId()
      }
    })
  }

  async fetch() {
    const u = await Database.Db.user.findUnique({
      where: {
        id: this.id
      }
    })
    return u
  }

  static async getByData(data: DBUser) {
    const u = await Database.Db.user.findUnique({
      where: data
    })

    return u;
  }

  async update(data: DBUser) {
    const u = await Database.Db.user.update({
      where: {
        id: this.id
      },
      data: data
    })

    return u
  }

  async remove() {
    await Database.Db.user.delete({
      where: {
        id: this.id
      }
    })

    this.destroy();
  }

  async count(data: DBUser) {
    return await Database.Db.user.count({
      where: data
    })
  }
}
