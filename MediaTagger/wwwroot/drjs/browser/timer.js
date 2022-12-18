import { LOG_LEVEL, Logger } from "../../drjs/logger.js";

const log = Logger.create("Timer", LOG_LEVEL.INFO);

class CancelToken {
  constructor(id) {
    this.id = id;
  }
  cancel() {
    clearTimeout(this.id);
  }
}

export function OnNextLoop(func) {
  return new CancelToken(setTimeout(func, 0));
}

export function DelayMsecs(msecs, func) {
  return new CancelToken(setTimeout(func, msecs));
}

export default { OnNextLoop, DelayMsecs };
