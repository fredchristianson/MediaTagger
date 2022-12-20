import { LOG_LEVEL, Logger } from "../../logger.js";
const log = Logger.create("Listeners", LOG_LEVEL.WARN);

export class Listeners extends Array {
  constructor(...args) {
    super();
    args.forEach((arg) => {
      this.push(arg);
    });
  }

  add(...args) {
    args.forEach((arg) => {
      this.push(arg);
    });
  }

  removeAll() {
    while (this.length > 0) {
      this.shift().remove();
    }
  }
}
export default Listeners;
