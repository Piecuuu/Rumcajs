
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
