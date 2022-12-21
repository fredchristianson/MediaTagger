import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import { CancelToken } from "./task.js";
const log = Logger.create("Timer", LOG_LEVEL.INFO);

export function OnNextLoop(func) {
  return new CancelToken(setTimeout(func, 0));
}

export function DelayMsecs(msecs, func) {
  return new CancelToken(setTimeout(func, msecs));
}

export class Debouncer {
  constructor(msecs, func = null) {
    this.delayMsecs = msecs;
    this.runFunc = func;
    this.cancelToken = null;
  }

  run(func = null, ...args) {
    if (this.cancelToken) {
      this.cancelToken.cancel();
    }
    if (func != null) {
      this.runFunc = func;
    }
    this.args = args;
    this.cancelToken = new CancelToken(
      setTimeout(() => {
        this.runFunc(...args);
      }, this.delayMsecs)
    );
  }
}

export default { OnNextLoop, DelayMsecs };
