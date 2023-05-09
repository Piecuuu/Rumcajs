export class ApiLogger {
  private static _logger: ApiLogger;
  static get logger(): ApiLogger {
    return this._logger
  }

  msg(code: number, message: string): { code: number, message: string } {
    return {
      code: code,
      message: message
    }
  }
}

export const servererror = () => {
  return ApiLogger.logger.msg(69, "Internal server error")
}
