import { GuildMember, Permissions, PermissionsBitField, User } from "discord.js";
import { Owners } from "../config.js";
import { Database } from "../db.js";
import { Common } from "./common.js";
import { APIGuild } from "../api/routes/guild.js";

export class PermissionsCheck {
  static async isAdmin(member: GuildMember): Promise<boolean> {
    const guild = await Database.Db.guild.findUnique({
      select: {
        adminRoles: true,
        guildid: true
      },
      where: {
        guildid: member.guild.id
      }
    })
    const guildfetched = member.guild

    if(!guild) {
      await APIGuild.createGuild(member.guild.id)
      return this.isHavingPermission(member, PermissionsBitField.Flags.Administrator);
    };

    if(guildfetched?.ownerId == member.id) return true
    if(this.isHavingPermission(member, PermissionsBitField.Flags.Administrator)) return true;
    if(guild.adminRoles.length <= 0 || !guild.adminRoles) return false;

    let hasRole = false;

    guild.adminRoles.forEach(role => {
      if(hasRole) return true
      const test = member.roles.cache.has(role)
      if(test) hasRole = true
    })

    return hasRole;
  }

  static isDev(user: User) {
    return Owners.includes(user.id)
  }

  static isHavingPermission(member: GuildMember, perm: bigint) {
    return member.permissions.has(perm)
  }

  static getHighestRankFromMemberList(members: GuildMember[]): GuildMember {
    const highest = members.reduce((a, b) => {
      return a.roles.highest.position > b.roles.highest.position ? a : b
    })

    return highest
  }

  static getPermissionName(perm: bigint): Permissions | null {
    for (const [name, value] of Object.entries(PermissionsBitField.Flags)) {
      if ((perm & value) === value) {
        return name;
      }
    }
    return null;
  }

  static isPermissionValid(perm: Permissions): boolean {
    return PermissionsBitField.Flags.hasOwnProperty(perm)
  }

  static async isPermittedToPunish(member: GuildMember) {
    return await this.isAdmin(member)
  }

  static async canBePunished(member: GuildMember) {
    return ((await this.isAdmin(member)) || member.guild?.ownerId == member.id)
  }

  static async canMemberPunishOtherMember(executor: GuildMember, target: GuildMember) {
    if(this.getHighestRankFromMemberList([executor, target]).id == executor.id || executor.guild.ownerId == executor.id) return true

    return false
  }
}

/* import("../misc/permcheck.js").then(async permcheck => {
  const mbs = await interaction.guild.members.fetch()
  const { logger } = await import("../config.js")

  mbs?.forEach(async mb => {
    (new permcheck.PermissionsCheck()).isAdmin(mb).then((result) => {
      //interaction.channel.send(`${mb.user.tag} - ${result.toString()}`)

      //logger.debug(`${mb.user.tag} - ${result.toString()}`)
    })
  });
}) */

