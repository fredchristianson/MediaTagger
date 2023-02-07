import { Logger } from '../logger.js';
import { env } from '../env.js';
const log = Logger.create('Application');

export class Application {
  constructor(name = 'unnamed') {
    env.THEAPP = this;
    this.name = name;
    log.debug('application', name, 'initialized');
  }

  start() {
    log.debug('application', this.name, 'started');
    this.initialize();
  }

  initialize() {}
}
export default Application;
