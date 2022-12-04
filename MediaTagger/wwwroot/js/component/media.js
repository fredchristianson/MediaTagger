import {ComponentBase} from '../../drjs/browser/component.js';
import {HtmlTemplate, ReplaceTemplateValue} from '../../drjs/browser/html-template.js';
import { LOG_LEVEL, Logger } from '../../drjs/logger.js';
import {DOM} from '../../drjs/browser/dom.js';
import EVENT from '../../drjs/browser/dom-event.js';
import UTIL from '../../drjs/util.js';

const log = Logger.create("MediaComponent", LOG_LEVEL.DEBUG);
import api from '../mt-api.js';

var MAX_MEDIA_ITEMS = 5000;

export class MediaComponent extends ComponentBase{
    constructor(selector, htmlName='media') {
        super(selector,htmlName);
        this.loadCompleteHandler = this.loadComplete.bind(this);
        this.loadErrorHandler = this.loadError.bind(this);


    }

    async onHtmlInserted(elements) {
        this.dom = new DOM(this.parent);
        let options = {
            root: null,
            rootMargin: '0px',
            threshold: 1.0
          };
          
        let observer = new IntersectionObserver(this.intersectionChange.bind(this), options);
        var template = new HtmlTemplate(this.dom.first('#media-item-template'));
        var items = this.dom.first(".items");
        this.allItems = await api.GetAllMediaItems();
        log.debug("got ",this.allItems.length," media items");
        for(var i=0;i<this.allItems.length && i<MAX_MEDIA_ITEMS;i++) {
            var item = this.allItems[i];
            var htmlItem = template.fill({
                ".name": item.name,
                ".thumbnail, .test": new ReplaceTemplateValue("{id}",item.primaryFileId)
            });
            var newNode = this.dom.append(items,this.dom.first(htmlItem,'image.thumbnail'));
            observer.observe(newNode);

        }
        // load multiple images at a time but limit
        this.scheduled = 0;
        this.running = 0;
        for(var cnt=0;cnt<5;cnt++)  {
            this.scheduleLoadNext();
            
        }
    }

    intersectionChange(entries,observer) {
        log.debug("intersection change");
        entries.forEach(entry=>{
            if (entry.isIntersecting) {
                this.dom.addClass(entry.target,'in-view');
            } else {
                this.dom.removeClass(entry.target,'in-view');
            }
        });
    }



    scheduleLoadNext() {
        if (this.running>5 || this.scheduled > 5) {
            log.error("too many requests");
            return;
        }
        setTimeout(this.loadNext.bind(this),0);
        this.scheduled += 1;
        log.debug("scheduled "+this.scheduled);
    }
    loadNext() {
        this.scheduled -= 1;
        this.running += 1;
        log.debug("running "+this.running+"scheduled "+this.scheduled);
        // first do ones in view
        var img = this.dom.first(".in-view .loading");
        if (img == null) {
            // none in view so get the next
            img = this.dom.first(".loading");
        }
        if (img == null) {
            // none still .loading, so done
            this.running -= 1;
            log.debug("running "+this.running+"scheduled "+this.scheduled);

            return;
        }
        var src = this.dom.getData(img,'src');
        if (!UTIL.isEmpty(src)) {
            this.dom.addClass(img,'load-waiting');
            this.dom.removeClass(img,'loading');
            var parent = img.parentNode;
            var name = this.dom.first(parent,".name").innerText;
            log.debug("loading ",name," ",src);
            img.addEventListener('load',this.loadCompleteHandler);
            img.addEventListener('error',this.loadErrorHandler);
            img.setAttribute('src',src+"?v=1");
            if (img.loadComplete) {
                this.dom.removeClass(img,'loading');
                this.dom.removeClass(img,'load-waiting');
                this.dom.removeClass(img,'error');
                img.removeEventListener('load',this.loadCompleteHandler);
                img.removeEventListener('error',this.loadErrorHandler);
                this.running -= 1;
                this.scheduleLoadNext();
                log.debug("already loaded");
            }
        } else {
            log.debug("done loading");
        }
    }

    loadComplete(event) {
        log.debug("loaded");
        var img = event.target;
        if (!this.dom.hasClass(img,'load-waiting')){
            return;
        }
        this.dom.removeClass(img,'loading');
        this.dom.removeClass(img,'load-waiting');
        this.dom.removeClass(img,'error');
        img.removeEventListener('error',this.loadErrorHandler);
        img.removeEventListener('load',this.loadCompleteHandler);
        this.running -= 1;
        this.scheduleLoadNext();
    }

    loadError(event){
        var img = event.target;
        log.debug("error ");
        img.removeEventListener('error',this.loadErrorHandler);
        img.removeEventListener('error',this.loadCompleteHandler);
        this.dom.removeClass(img,'load-waiting');
        this.dom.removeClass(img,'loading');
        this.dom.addClass(img,'error');
        img.setAttribute('src','image/error.png');
        this.running -= 1;
        this.scheduleLoadNext();
    
    }


    loadNextold() {
        var images = this.dom.find(".loading");
        images.forEach(img=>{
            var src = this.dom.getData(img,'src');
            if (!UTIL.isEmpty(src)) {
                log.debug("loading ",src);
                img.addEventListener('load',()=>{
                    log.debug("loaded");
                    this.dom.removeClass(img,'loading');
                });
                img.addEventListener('error',()=>{
                    log.debug("error ",src);

                    this.dom.removeClass(img,'loading');
                    this.dom.addClass(img,'error');
                });
                img.setAttribute('src',src);
            }
        });
    }
}

export default MediaComponent;