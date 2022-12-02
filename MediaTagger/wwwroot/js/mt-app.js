import ENV from '../drjs/env.js';
import Application from '../drjs/browser/application.js';
import { LOG_LEVEL, Logger } from '../drjs/logger.js';
import page from '../drjs/browser/page.js';

import util from '../drjs/util.js';
import DOMEvent from "../drjs/browser/dom-event.js";
import DOM from "../drjs/browser/dom.js";
import SignalR from "../drjs/browser/signalr.js";

//import { DomLogWriter } from '../drjs/browser/log-writer-dom.js';

const log = Logger.create("MTApp", LOG_LEVEL.DEBUG);



import HomeComponent from './component/home.js';


export class MediaTaggerApp extends Application {
  constructor() {
    super("MediaTagger App");

  }

  initialize() {
    log.debug("test");
    DOMEvent.listen('componentLoaded', this.onComponentLoaded.bind(this));
    
    
    this.mainComponent = new HomeComponent('#main-content');

    this.signalr = SignalR.create("/hub/log").build().handle("LogMessage", (message) => log.debug("LogMessage", message))
    .handle("Debug", (message) => log.debug("Debug", message))
    .handle("Log", (message) =>
      log.debug("Log", message)
    );
    this.signalrImage = SignalR.create("/hub/image").build().handle("Update", (message) => log.debug("Update", message));


  }

 
  onComponentLoaded(component) {
    log.info("loaded component ", component.getName());
  }


}

export default MediaTaggerApp;