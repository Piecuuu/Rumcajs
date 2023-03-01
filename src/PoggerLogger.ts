import chalk from "chalk";

export type LoggerStyle =
  "Symbols" | "Emoji" | "Arrow" | "Text" | "Letter" | "ArrowBox";

export type LoggerStatuses =
  "INFO" | "WARN" | "FATAL" | "ERROR" | "DEBUG" | "VERBOSE"

export type ColorsMap = {
  [status in LoggerStatuses]: chalk.Chalk;
};

export type StatusMap = {
  [status in LoggerStatuses]: string
}

export const LoggerColors: ColorsMap = {
  INFO: chalk.blueBright,
  WARN: chalk.yellowBright,
  FATAL: chalk.red,
  ERROR: chalk.red,
  DEBUG: chalk.greenBright,
  VERBOSE: chalk.reset
}

export const colorTextConverter = (message: string, colorText: boolean = true, status: LoggerStatuses): string => {
  return colorText ? LoggerColors[status](message) : chalk.reset(message)
}

export const symbolStyle: StatusMap = {
  ERROR: "[-] ",
  FATAL: "[=] ",
  WARN: "[!] ",
  DEBUG: "[~] ",
  INFO: "[+] ",
  VERBOSE: "[/] "
}

export const emojiStyle: StatusMap = {
  ERROR: "[⛔] ",
  FATAL: "[❗] ",
  WARN: "[⚠️] ",
  DEBUG: "[🪲] ",
  INFO: "[ℹ️] ",
  VERBOSE: "[📝] "
}

export const arrowStyle: StatusMap = {
  INFO: "=> ",
  WARN: "=> ",
  FATAL: "=> ",
  ERROR: "=> ",
  DEBUG: "=> ",
  VERBOSE: "=> "
}

export const arrowBoxStyle: StatusMap = {
  INFO: "[>] ",
  WARN: "[>] ",
  FATAL: "[>] ",
  ERROR: "[>] ",
  DEBUG: "[>] ",
  VERBOSE: "[>] "
}

export const letterStyle: StatusMap = {
  INFO: "[I] ",
  WARN: "[W] ",
  FATAL: "[F] ",
  ERROR: "[E] ",
  DEBUG: "[D] ",
  VERBOSE: "[V] "
}

export const textStyle: StatusMap = {
  INFO: "[INFO] ",
  WARN: "[WARN] ",
  FATAL: "[FATAL] ",
  ERROR: "[ERROR] ",
  DEBUG: "[DEBUG] ",
  VERBOSE: "[VERBOSE] "
}

export const Styles = {
  "Symbols": symbolStyle,
  "Emoji": emojiStyle,
  "Arrow": arrowStyle,
  "ArrowBox": arrowBoxStyle,
  "Text": textStyle,
  "Letter": letterStyle
}

export const getMessageInStyle = (style: LoggerStyle, message: string, colorText: boolean = true, showTime: boolean = true, status: LoggerStatuses) => {
  const time = (showTime ? (chalk.magentaBright(" " + getTime()) + " ") : "")

  const things: StatusMap = {
    ERROR: time + LoggerColors.ERROR(Styles[style].ERROR) + colorTextConverter(message, colorText, "ERROR"),
    FATAL: time + LoggerColors.FATAL(Styles[style].FATAL) + colorTextConverter(message, colorText, "FATAL"),
    WARN: time + LoggerColors.WARN(Styles[style].WARN) + colorTextConverter(message, colorText, "WARN"),
    DEBUG: time + LoggerColors.DEBUG(Styles[style].DEBUG) + colorTextConverter(message, colorText, "DEBUG"),
    INFO: time + LoggerColors.INFO(Styles[style].INFO) + colorTextConverter(message, colorText, "INFO"),
    VERBOSE: time + LoggerColors.VERBOSE(Styles[style].VERBOSE) + colorTextConverter(message, colorText, "VERBOSE")
  }

  return things[status]
}

export class Logger {
  private _style: LoggerStyle;
  private _color: boolean;
  private _showTime: boolean;
  private _colorText: boolean;
  private _isDebug: boolean;

  /**
   * @param  {LoggerStyle="Symbols"} style
   * @param  {boolean=true} color
   * @param  {boolean=true} showTime
   * @param  {boolean=false} colorText
   */
  constructor(style: LoggerStyle = "Symbols", color: boolean = true, showTime: boolean = true, colorText: boolean = false, debug: boolean = false) {
    this._style = style;
    this._color = color;
    this._showTime = showTime;
    this._colorText = colorText;
    this._isDebug = debug;
  }
  /**
   * @param  {string[]} ...message
   */
  info(...message: string[]) {
    const msg: string = message.join(" ")

    for (let i = 0; i < msg.split("\n").length; i++) {
      console.log(getMessageInStyle(this._style, msg.split("\n")[i], this._colorText, this._showTime, "INFO"));
    }
  }
  /**
   * @param  {string[]} ...message
   */
  debug(...message: string[]) {
    if(!this._isDebug) return;

    const msg: string = message.join(" ")

    for (let i = 0; i < msg.split("\n").length; i++) {
      console.log(getMessageInStyle(this._style, msg.split("\n")[i], this._colorText, this._showTime, "DEBUG"));
    }
  }
  /**
   * @param  {string[]} ...message
   */
  error(...message: string[]) {
    const msg: string = message.join(" ")

    for (let i = 0; i < msg.split("\n").length; i++) {
      console.log(getMessageInStyle(this._style, msg.split("\n")[i], this._colorText, this._showTime, "ERROR"));
    }
  }
  /**
   * @param  {string[]} ...message
   */
  fatal(...message: string[]) {
    const msg: string = message.join(" ")

    for (let i = 0; i < msg.split("\n").length; i++) {
      console.log(getMessageInStyle(this._style, msg.split("\n")[i], this._colorText, this._showTime, "FATAL"));
    }
  }
  /**
   * @param  {string[]} ...message
   */
  warn(...message: string[]) {
    const msg: string = message.join(" ")

    for (let i = 0; i < msg.split("\n").length; i++) {
      console.log(getMessageInStyle(this._style, msg.split("\n")[i], this._colorText, this._showTime, "WARN"));
    }
  }
  /**
   * @param  {string[]} ...message
   */
  verbose(...message: string[]) {
    const msg: string = message.join(" ")

    for (let i = 0; i < msg.split("\n").length; i++) {
      console.log(getMessageInStyle(this._style, msg.split("\n")[i], this._colorText, this._showTime, "VERBOSE"));
    }
  }
  /**
   * @param  {LoggerStyle} newStyle
   */
  switchCurrentStyle(newStyle: LoggerStyle) {
    this._style = newStyle
  }
  /**
   * @returns LoggerStyle
   */
  getCurrentStyle(): LoggerStyle {
    return this._style;
  }
}

const getDateAndTime = (): string => {
  const date: string = new Date().toLocaleString().split(",").join("");

  return date;
}

const getTime = (): string => {
  const time: string = new Date().toLocaleString().split(",")[1].replace(" ", "");

  return time;
}

const getDate = (): string => {
  const date: string = new Date().toLocaleString().split(",")[0];

  return date;
}
