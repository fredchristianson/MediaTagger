import assert from '../assert.js';
import Logger from '../logger.js';
import util from '../util.js';

const log = Logger.create("SignalR");

export class SignalRClient {
  constructor(hubName) {
    this.hubName = hubName;
    }

    addMessageHandler(hub, name, handler) {
    }

}

function create(hubName) {
  return new SignalRClient(hubName);
}

export default create;