import { Router } from 'express';
import { Logger } from '../logger.js';
export const appRouter = Router();
interface Options {
  path: string;
  method: 'get' | 'post' | 'put' | 'delete' | 'patch';
  middlewares?: any[],
}
function Route(options: Options) {
  Logger.Logger.verbose(`${options.method} ${options.path} decorator called.`)
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Logger.Logger.verbose(`${options.method} ${options.path} Registered`);
    (appRouter as any)[options.method](options.path, target[propertyKey]);
  };
}
export default Route;
