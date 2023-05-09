import { EmbedBuilder } from "discord.js";
import { Colors } from "../config.js";
import { PermissionsCheck } from "./permcheck.js";
import { Translation } from "../handlers/lang.js";

export const crossEmoji = "<:cross:1095323462387634276>"
export const checkEmoji = "<:check:1095323464933580941>"

export class BaseEmbed extends EmbedBuilder {
  public translation: Promise<Translation>
  constructor(guildId?: string) {
    super()
    this.setTimestamp(new Date())

    //this.translation = new Translation(Translation.getGuildLangCode(guildId).then((lang) => lang))
    if(!guildId) return
    const code = Translation.getGuildLangCode(guildId)
    this.translation = Promise.resolve(new Translation().init(code))
  }

  setTranslation(translation: Promise<Translation>): this {
    this.translation = translation
    return this
  }
}

export class NeutralEmbed extends BaseEmbed {
  constructor(guildId?: string) {
    super(guildId)

    this.setColor(Colors.NeutralBlue)
  }
}

export class ErrorEmbed extends BaseEmbed {
  constructor(guildId?: string) {
    super(guildId)

    this.setColor(Colors.ErrorRed)
  }

  setDescription(description: string | null, emoji: boolean = true): this {
    const emojified = emoji ? `${crossEmoji} ${description}` : description
    return super.setDescription(emojified)
  }
}

export class SuccessEmbed extends BaseEmbed {
  constructor(guildId?: string) {
    super(guildId)

    this.setColor(Colors.SuccessGreen)
  }

  setDescription(description: string | null, emoji: boolean = true): this {
    const emojified = emoji ? `${checkEmoji} ${description}` : description
    return super.setDescription(emojified)
  }
}

export const invalidUserEmbed = async (guildId: string) => {
  const e = new ErrorEmbed(guildId)
  e.setDescription(await (await e.translation).get("error.invalid-user")!, true);
  return e
}

export const tooLongReasonEmbed = async (guildId: string) => {
  const e = new ErrorEmbed(guildId)
  e.setDescription(await (await e.translation).get("error.reason-too-long"), true)
  return e
}

export const userIsAdminEmbed = async (guildId: string) => {
  const e = new ErrorEmbed(guildId)
  e.setDescription(await (await e.translation).get("error.user-is-admin"), true)
  return e
}

export const userNotAdminEmbed = async (guildId: string) => {
  const e = new ErrorEmbed(guildId)
  e.setDescription(await (await e.translation).get("error.executor-not-admin"), true)
  return e
}

export const noPermissionsEmbed = async (perm: bigint, guildId: string) => {
  const emb = new ErrorEmbed(guildId)
  emb.setDescription(
    (await (await emb.translation).get("error.bot-no-perms"))
      .replace("{PERM}", PermissionsCheck.getPermissionName(perm)!),
    true
  )
  return emb
}

export const memberNoPermsEmbed = async (perm: bigint, guildId: string) => {
  const emb = new ErrorEmbed(guildId)
  emb.setDescription(
    (await (await emb.translation).get("error.member-no-perms"))
      .replace("{PERM}", PermissionsCheck.getPermissionName(perm)!),
    true
  )
  return emb
}

export const targetRanksAreAboveExecutor = async (guildId: string) => {
  const e = new ErrorEmbed(guildId)
  e.setDescription(await (await e.translation).get("error.target-has-higher-ranks"), true)
  return e
}

export const timeTooLongEmbed = async (guildId: string) => {
  const e = new ErrorEmbed(guildId)
  e.setDescription(await (await e.translation).get("common.error.time-too-long"), true)

  return e
}

export const memberNotGuildOwner = async (guildId: string) => {
  const e = new ErrorEmbed(guildId)
  e.setDescription(await (await e.translation).get("error.not-guild-owner"), true)

  return e
}

