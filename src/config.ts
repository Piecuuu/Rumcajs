import { Logger } from "./logger.js";
import { DBSettings } from "./types.js";

// (process.env.SZCZUR_DEBUG.toLowerCase() == "true")
export const isDebug: boolean = process.env.SZCZUR_DEBUG ? true : false

export const logger = new Logger({
  style: "Arrow",
  color: true,
  colorText: true,
  debug: isDebug,
  logPath: "../logs",
  saveLogs: true,
  showTime: true
})
export const token: string = process.env.DISCORDTOKEN as string;
export const port: number = parseInt(process.env.SZCZUR_PORT as string ?? 4040)
export const dbSettings: DBSettings = {
  provider: "postgresql"
}

export const Colors = {
  SuccessGreen: 0x56b300,//0x00750c,
  ErrorRed: 0xbd021b,
  NeutralBlue: 0x0275bd
}

export const Owners: string[] = [
  "633313654283960330",
  "829040180937097246"
]

export const EchoUsers: string[] = [
  "633313654283960330",
  "829040180937097246",
  "678191118063632388"
]

export const EvalUser: string = "633313654283960330";
/**
  * @deprecated Unused, replaced with random values
  */
export const specialRoleColors: number[] = [
  0xff7878, 0xffa378, 0xffdd78, 0xc7ff78, 0x78ffbc,
  0x789eff, 0x9578ff, 0xeb7aff, 0xff7a97, 0x7c7aff,
  0x360266, 0xc0b0cf
]
