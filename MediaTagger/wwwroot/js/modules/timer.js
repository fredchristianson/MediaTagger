import { LOG_LEVEL, Logger } from "../../drjs/logger.js";

const log = Logger.create("Timer", LOG_LEVEL.INFO);

export function OnNextLoop(func) {
  return setTimeout(func, 0);
}

export function DelayMsecs(msecs, func) {
  return setTimeout(func, msecs);
}

export default { OnNextLoop, DelayMsecs };
