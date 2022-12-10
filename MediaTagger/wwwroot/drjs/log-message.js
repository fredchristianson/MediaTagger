import ENV from "./env.js";
import { LogLevel, LOG_LEVEL } from "./logger-interface.js";
export { LogLevel, LOG_LEVEL } from "./logger-interface.js";

if (ENV.DEBUG) {
  LOG_LEVEL.DEFAULT = new LogLevel(100, "DEBUG");
} else {
  LOG_LEVEL.DEFAULT = new LogLevel(60, "WARN");
}

export class LogMessage {
  constructor(moduleName, level, parts) {
    this.moduleName = moduleName;
    this.level = level;
    this.parts = parts;
    this.time = new Date();
  }

  getLevel() {
    return this.level;
  }

  getModuleName() {
    return this.moduleName;
  }

  getParts() {
    return this.parts;
  }

  // if the writer doesn't have a formatter, use a simple format
  getMessageText() {
    return this.parts.join(" ");
  }

  getLogLevelDescription() {
    var v = this.level.value ? this.level.value : this.level;
    if (v == LOG_LEVEL.NEVER.value) {
      return "NEVER";
    }
    if (v == LOG_LEVEL.ALWAYS.value) {
      return "ALWAYS";
    }
    if (v < LOG_LEVEL.WARN.value) {
      return "ERROR";
    } else if (v < LOG_LEVEL.INFO.value) {
      return "WARN";
    } else if (v < LOG_LEVEL.DEBUG.value) {
      return "INFO";
    } else {
      return "DEBUG";
    }
  }
}

export default LogMessage;
