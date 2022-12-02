import {ComponentBase} from '../../drjs/browser/component.js';
import {HtmlTemplate, ReplaceTemplateValue} from '../../drjs/browser/html-template.js';
import { LOG_LEVEL, Logger } from '../../drjs/logger.js';
import {DOM} from '../../drjs/browser/dom.js';

const log = Logger.create("MediaComponent", LOG_LEVEL.DEBUG);
import api from '../mt-api.js';

var MAX_MEDIA_ITEMS = 100000;

export class MediaComponent extends ComponentBase{
    constructor(selector, htmlName='media') {
        super(selector,htmlName);
    }

    async onHtmlInserted(elements) {
        this.dom = new DOM(this.parent);

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
            this.dom.append(items,htmlItem);

        }
        this.watchLoad();
    }

    watchLoad() {
        var images = this.dom.find("img");
        images.forEach(img=>{
            if (img.complete){
                this.dom.removeClass(img,'loading');
            }else {
                img.addEventListener('load',()=>{
                    this.dom.removeClass(img,'loading');
                });
                img.addEventListener('error',()=>{
                    this.dom.removeClass(img,'error');
                });
            }
        });
    }
}

export default MediaComponent;