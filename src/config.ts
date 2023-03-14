import { Logger } from "./PoggerLogger.js";

export const logger = new Logger({
  style: "Arrow",
  color: true,
  colorText: true,
  debug: true,
  logPath: "../logs",
  saveLogs: true,
  showTime: true
})
export const token: string = process.env.DISCORDTOKEN as string;

export const Colors = {
  SuccessGreen: 0x56b300,//0x00750c,
  ErrorRed: 0xbd021b,
  NeutralBlue: 0x0275bd
}
