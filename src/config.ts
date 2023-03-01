import { Logger } from "./PoggerLogger";

export const logger = new Logger("Arrow", true, true, true, true)
export const token: string = process.env.DISCORDTOKEN as string;

export const Colors = {
  SuccessGreen: 0x56b300,//0x00750c,
  ErrorRed: 0xbd021b,
  NeutralBlue: 0x0275bd
}
