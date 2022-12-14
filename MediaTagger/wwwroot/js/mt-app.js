import ENV from "../drjs/env.js";
import Application from "../drjs/browser/application.js";
import {
  Listeners,
  EventListener,
  ObjectListener,
  EventEmitter,
} from "../drjs/browser/event.js";
import { ComponentLoadedEvent } from "../drjs/browser/component.js";
//import { DomLogWriter } from '../drjs/browser/log-writer-dom.js';
import { LOG_LEVEL, Logger } from "../drjs/logger.js";
const log = Logger.create("MTApp", LOG_LEVEL.WARN);

import Media from "./modules/media.js";

import MainComponent from "./component/main.js";

export class MediaTaggerApp extends Application {
  constructor() {
    super("MediaTagger App");
  }

  async initialize() {
    this.listeners = new Listeners(
      new EventListener(ComponentLoadedEvent, this)
    );
    await Media.loadItems();

    this.mainComponent = new MainComponent("#main-content");
  }

  onComponentLoaded(component, data, type) {
    log.info("loaded component ", component.getName());
  }
}

export default MediaTaggerApp;
