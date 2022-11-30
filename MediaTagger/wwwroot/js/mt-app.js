import ENV from '../drjs/env.js';
import Application from '../drjs/browser/application.js';
import { LOG_LEVEL, Logger } from '../drjs/logger.js';
import page from '../drjs/browser/page.js';

import util from '../drjs/util.js';
import DOMEvent from "../drjs/browser/dom-event.js";
import DOM from "../drjs/browser/dom.js";
import SignalR from "../drjs/browser/signalr.js";

import { DomLogWriter } from '../drjs/browser/log-writer-dom.js';

const log = Logger.create("MTApp", LOG_LEVEL.DEBUG);



import HeaderComponent from './component/header.js';
import HomeComponent from './component/home.js';
import FooterComponent from './component/footer.js';
import SettingsComponent from './component/settings.js';

const PAGE_MAIN_COMPONENT = {
  "index": HomeComponent,
  "home": HomeComponent,
  "settings": SettingsComponent,
};


export class MediaTaggerApp extends Application {
  constructor() {
    super("MediaTagger App");

  }

  initialize() {
    new DomLogWriter('#log-container .messages', LOG_LEVEL.INFO);
    log.debug("test");
    var gotoPage = location.hash.substr(1);
    page.setDefaultPage('index');
    this.header = new HeaderComponent('header');
    this.main = this.loadMainContent('home');

   this.footer = new FooterComponent('footer');
    DOMEvent.listen('click', '#main-nav a', this.onNav.bind(this));
    DOMEvent.listen('componentLoaded', this.onComponentLoaded.bind(this));
    
    DOMEvent.listen('click', '#reload-page', this.reload.bind(this));
    DOMEvent.listen('click', '#toggle-log', this.toggleLog.bind(this));
    DOMEvent.listen('click', '#log-clear', this.clearLog.bind(this));
   
    if (gotoPage && gotoPage.length > 0) {
      this.loadMainContent(gotoPage);
    }

    this.signalr = SignalR.create("/log").build();

  }

 
  clearLog() {
    DOM.removeChildren("#log-container .messages");
  }
  toggleLog() {
    DOM.toggleClass('#log-container', 'hidden');
    DOM.toggleClass('#toggle-log', 'off');
  }

  reload() {
    location.reload(true);
  }


 

  onComponentLoaded(component) {
    log.info("loaded component ", component.getName());
    this.setNav();
  }

  onNav(element, event) {
    var href = element.getAttribute("href");
    if (href != null && href[0] == '#') {
      var sel = href.substr(1);
      if (sel) {
        this.loadMainContent(sel);
        event.stopPropagation();
        event.preventDefault();
      }

    }
  }

  loadMainContent(page = null) {
    if (util.isEmpty(page)) {
      page = "home";
    }
    this.currentPage = page;
    log.info("load component ", page);
    location.hash = page;
    const componentHandler = PAGE_MAIN_COMPONENT[page] || HomeComponent;

    this.mainComponent = new componentHandler('#main-content');
  }

  setNav() {
    DOM.removeClass("#main-nav a", 'active');
    DOM.addClass("a[href='#" + this.currentPage + "']", 'active');

  }


}

export default MediaTaggerApp;