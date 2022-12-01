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
    log.debug("LogMessage: ", msg);
  }

    addMessageHandler(hub, name, handler) {
    }

  build() {
    this.connection = this.builder.build();
    this.connection.start();
    //this.connection.on("LogMessage", (message) => this.logMessage(message));
    return this;
  }

  handle(method, handler) {
    this.connection.on(method, (data) => {
      try {
        handler(data);
      } catch (ex) {
        log.error("failed to handle method ", method, ex);
      }
    });
    return this;
  }
}

function create(hubName) {
  return new SignalRClient(hubName);
}

export default { create };