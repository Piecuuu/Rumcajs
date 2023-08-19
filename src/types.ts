
export interface creators {
  [x: string]: {
    role: string,
    hidden: boolean,
    id: string
  }
}

export enum InfractionType {
  Warn = "warn",
  Mute = "mute",
  Kick = "kick",
  Ban = "ban"
}

export enum UserActions {
  Unmute = 0,
  Clear = 1,
  InfractionRemove = 2
}

export interface DBSettings {
  provider: DBProvider
}

export type DBProvider = "mysql" | "postgresql" | "sqlite" | "mongodb";
