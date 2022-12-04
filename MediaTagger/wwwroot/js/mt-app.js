import ENV from '../drjs/env.js';
import Application from '../drjs/browser/application.js';
import DOMEvent from "../drjs/browser/dom-event.js";

//import { DomLogWriter } from '../drjs/browser/log-writer-dom.js';
import { LOG_LEVEL, Logger } from '../drjs/logger.js';
const log = Logger.create("MTApp", LOG_LEVEL.DEBUG);



import MainComponent from './component/main.js';
import SettingsComponent from './component/settings.js';


export class MediaTaggerApp extends Application {
  constructor() {
    super("MediaTagger App");

  }

  initialize() {
    DOMEvent.listen('componentLoaded', this.onComponentLoaded.bind(this));
    
    
   this.mainComponent = new MainComponent('#main-content');



  }

 
  onComponentLoaded(component) {
    log.info("loaded component ", component.getName());
  }


}

export default MediaTaggerApp;