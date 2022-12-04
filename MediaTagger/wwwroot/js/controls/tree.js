import dom from '../../drjs/browser/dom.js';
import HtmlTemplate from '../../drjs/browser/html-template.js';
import DOMEVENT from '../../drjs/browser/dom-event.js';
import { LOG_LEVEL, Logger } from '../../drjs/logger.js';
const log = Logger.create("Tree", LOG_LEVEL.DEBUG);

const ITEM_TEMPLATE = `
<div>
    <span class='open-close'></span><input type='checkbox'/><span class='name'></span>
    <div class='children'></div>
</div>`;

const TREE_ITEM_TYPE ={
    NODE: 0,
    LEAF: 1
};

export class TreeItem {
    constructor(name,isTop=false) {
        this.name = name;
        this.type = TREE_ITEM_TYPE.NODE;
        this.isTop = isTop;
        this.children = [];
    }
}

export class TreeDataProvider {
    getTopItems() { throw new "provider must implement GetTopItems()";}
}

export class Tree {
    constructor(containerElement, dataProvider) {
        this.containerElement = containerElement;
        this.dataProvider = dataProvider;
        this.fillTopItems();
    }

    async fillTopItems() {
        dom.removeChildren(this.containerElement);
        var template = new HtmlTemplate(ITEM_TEMPLATE);
        var items = await this.dataProvider.getTopItems();
        this.topItems = items;
        items.forEach(item=>{
            var element = template.fill({
                '.name':item.name
            });
            var element =dom.append(this.containerElement,element);
            DOMEVENT.listen('click',element,this.toggleOpen.bind(this),this);

        });
    }

    async toggleOpen(event) {
        log.debug("toggleopen");
    }
}