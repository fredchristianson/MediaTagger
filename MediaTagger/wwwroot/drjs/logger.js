import { logWriters } from "./log-writer.js";
import { LOG_LEVEL as IMPORTED_LOG_LEVEL, LogMessage } from "./log-message.js";
import ENV from "./env.js";
import { LogLevel } from "./logger-interface.js";

export const LOG_LEVEL = IMPORTED_LOG_LEVEL;

export class Logger {
  constructor(moduleName, level = null) {
    this.moduleName = moduleName;
    this.level = level ?? LOG_LEVEL.DEBUG;
  }

  setLevel(level) {
    if (typeof level == "number") {
      this.level = new LogLevel(level, "CUSTOM");
      return;
    }
    this.level = level;
  }

  getLevelValue() {
    if (this.level == null) {
      return 0;
    }
    if (this.level instanceof LogLevel) {
      return this.level.value;
    }
    return this.level * 1;
  }

  write(level, message) {
    var v = level.value ? level.value : level;
    if (v > this.getLevelValue() && v != LOG_LEVEL.NEVER.value) {
      return;
    }
    const logMessage = new LogMessage(this.moduleName, level, message);
    logWriters.write(logMessage);
  }

  always(...message) {
    this.write(LOG_LEVEL.ALWAYS, message);
  }

  debug(...message) {
    this.write(LOG_LEVEL.DEBUG, message);
  }
  info(...message) {
    this.write(LOG_LEVEL.INFO, message);
  }
  warn(...message) {
    this.write(LOG_LEVEL.WARN, message);
  }
  error(...message) {
    this.write(LOG_LEVEL.ERROR, message);
  }

  never() {
    return;
  }
}

Logger.create = function (moduleName, level = null) {
  return new Logger(moduleName, level);
};

ENV.createLogger = Logger.create;

export default Logger;
