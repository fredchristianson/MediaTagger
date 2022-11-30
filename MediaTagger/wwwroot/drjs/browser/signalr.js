import assert from '../assert.js';
import Logger from '../logger.js';
import util from '../util.js';

const log = Logger.create("SignalR");

export class SignalRClient {
  constructor(hubName) {
    this.hubName = hubName;
    this.builder = new signalR.HubConnectionBuilder()
      .withUrl(hubName);
  }

  logMessage(msg) {
    log.debug("LogMessage: ", message);
  }

    addMessageHandler(hub, name, handler) {
    }

  build() {
    this.connection = this.builder.build();
    this.connection.on("LogMessage", (message) => this.logMessage(message));
    this.connection.start();
  }
}

function create(hubName) {
  return new SignalRClient(hubName);
}

export default { create };