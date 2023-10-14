import { customAlphabet } from "nanoid";
import { dbSettings } from "../config.js";
import { ObjectId } from "bson";

export class RumcajsId {
  public static idLength = dbSettings.provider == "mongodb" ? new ObjectId().toString().length : 12;
  private static alphabet = "0123456789abcdefghik";
  private static nnid = customAlphabet(this.alphabet, this.idLength);

  static generateId(): string {
    let id: string;
    switch(dbSettings.provider) {
      case "mysql":
      case "postgresql":
      case "sqlite":
        id = this.nnid()
        break

      case "mongodb":
        id = new ObjectId().toString()
        break
    }

    return id
  }

  static isValid(id: string): boolean {
    switch(dbSettings.provider) {
      case "mysql":
      case "sqlite":
      case "postgresql":
        if(id.length != this.idLength && /^[a-k0-9]*$/.test(id)) return false
        break

      case "mongodb":
        if(!ObjectId.isValid(id)) return false
        break
    }

    return true
  }
}
