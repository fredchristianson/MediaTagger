import ENV from '../drjs/env.js';
import Application from '../drjs/browser/application.js';
import {Listeners,EventListener,ObjectListener, EventEmitter} from "../drjs/browser/event.js";
import { ComponentLoadedEvent} from '../drjs/browser/component.js';
//import { DomLogWriter } from '../drjs/browser/log-writer-dom.js';
import { LOG_LEVEL, Logger } from '../drjs/logger.js';
const log = Logger.create("MTApp", LOG_LEVEL.DEBUG);



import MainComponent from './component/main.js';


export class MediaTaggerApp extends Application {
  constructor() {
    super("MediaTagger App");

  }

  initialize() {
    this.listeners = new Listeners(
      new EventListener(ComponentLoadedEvent, this),
      new ObjectListener(this,'testevent', this.onTest.bind(this)),
      new ObjectListener(this,'bc', this.onTest.bind(this))
    );
    
    
   this.mainComponent = new MainComponent('#main-content');

   var emitter = new EventEmitter('testevent',this);
   setTimeout(()=>{ emitter.emit({'foo':1,'bar':"test"});},1000);

   var emitter2 = new EventEmitter('bc',this);
   setTimeout(()=>{ emitter2.emit({'foo':2,'abar':"test"});},1000);
  }

  onComponentLoaded(component,data,type) {
    log.info("loaded component ", component.getName());
  }

  onTest(event,data,type) {
    log.info("got test event",event);
  }


}

export default MediaTaggerApp;