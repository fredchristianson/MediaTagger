import assert from '../assert.js';
import Logger from '../logger.js';
import util from '../util.js';

const log = Logger.create("SignalR");

export class SignalRClient {
    constructor() {
    }

    addMessageHandler(hub, name, handler) {
    }

}

function create() {
  return new SignalRClient();
}

export default create;