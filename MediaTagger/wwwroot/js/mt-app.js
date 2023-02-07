import '../drjs/env.js';
import Application from '../drjs/browser/application.js';
import { Listeners, EventListener } from '../drjs/browser/event.js';
import { ComponentLoadedEvent } from '../drjs/browser/component.js';
//import { DomLogWriter } from '../drjs/browser/log-writer-dom.js';
import { media } from './modules/media.js';
import { LOG_LEVEL, Logger } from '../drjs/logger.js';
const log = Logger.create('MTApp', LOG_LEVEL.WARN);


import MainComponent from './component/main.js';
import { defaultFormatter } from '/drjs/log-formatter.js';

export class MediaTaggerApp extends Application {
  constructor() {
    super('MediaTagger App');
    defaultFormatter.MaxLength = 1000;
  }

  async initialize() {
    this.listeners = new Listeners(
      new EventListener(ComponentLoadedEvent, this)
    );
    await media.loadItems();

    this.mainComponent = new MainComponent('#main-content');
  }

  onComponentLoaded(component, data, type) {
    log.info('loaded component ', component.getName());
  }
}

export default MediaTaggerApp;
