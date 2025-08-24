import { RobotCopy } from './core/RobotCopy';
declare const robotCopy: RobotCopy;
declare const app: import("express-serve-static-core").Express;
declare function startServer(): Promise<void>;
export { app, startServer, robotCopy };
