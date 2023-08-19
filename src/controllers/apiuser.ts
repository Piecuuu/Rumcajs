import { Database } from "../db.js";
import { DBApiUser } from "../db/connector.js";
import { RumcajsId } from "../misc/id.js";
import { Model } from "./model.js";

export class ApiUser extends Model {
  static async add(user: DBApiUser) {
    const u = await Database.Db.apiUser.create({
      data: {
        ...user,
        id: RumcajsId.generateId()
      }
    })

    return u
  }

  async fetch() {
    const u = await Database.Db.apiUser.findUnique({
      where: {
        id: this.id
      }
    })
    return u
  }

  static async getByData(data: DBApiUser) {
    const u = await Database.Db.apiUser.findUnique({
      where: data
    })

    return u;
  }

  async update(data: DBApiUser) {
    const u = await Database.Db.apiUser.update({
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

  async count(data: DBApiUser) {
    return await Database.Db.apiUser.count({
      where: data
    })
  }
}
