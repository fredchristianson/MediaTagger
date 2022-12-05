import dom, { DOM } from '../../drjs/browser/dom.js';
import HtmlTemplate from '../../drjs/browser/html-template.js';
import { LOG_LEVEL, Logger } from '../../drjs/logger.js';
const log = Logger.create("Tree", LOG_LEVEL.DEBUG);
import {Listeners, ClickHandler} from "../../drjs/browser/event.js";

const ITEM_TEMPLATE = `
<div class='tree-item'>
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
        this.children = null;
        this.isSelected = false;
        this.isChildSelected = false;
    }
}

export class TreeDataProvider {
    getTopItems() { throw new Error("provider must implement GetTopItems()");}
}

export class Tree {
    constructor(containerElement, dataProvider) {
        this.containerElement = containerElement;
        this.dataProvider = dataProvider;
        this.fillTopItems();
        
        this.listeners = new Listeners();
    }

    detach() {
        this.listeners.remove();
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
            var added =dom.append(this.containerElement,element);
            //dom.setData(added,"tree-item",item);
            element.tree = {
                item: item,
                selected: item.selected,
                open: item.isSelected || item.isChildSelected
            };
            //dom.addClass(added,'closed');
            this.setupElement(element);
            this.listeners.push(new ClickHandler(added,
                                        (event)=>{this.toggleOpen(added,item,event);}));

        });
    }

    async toggleOpen(element, item) {
        log.debug("toggleopen");
        log.debug("treeElement ",element, item);
        var treeData = element.tree;
        if (treeData == null) {
            log.error("element is not a tree item",element);
            return;
        }
        treeData.open = !treeData.open;
        this.setupElement(element);
        
    }

    async setupElement(element) {
        var treeData = element.tree;
        if (treeData == null) {
            log.error("element is not a tree item",element);
            return;
        }

        dom.toggleClass(element,'closed',!treeData.open);
        dom.toggleClass(element,'open',treeData.open);
        if (treeData.open && treeData.children == null) {
            await this.getChildren(element,treeData);
        }
    }

    async getChildren(element,treeData){
        if (treeData.children != null) { return;}
        var childContainer = dom.first(element,'.children');
        await this.dataProvider.getChildren(treeData.item);
            var template = new HtmlTemplate(ITEM_TEMPLATE);
            treeData.item.children.forEach(item=>{
                var child = template.fill({
                    '.name':item.name
                });
                var added =dom.append(childContainer,child);
                //dom.setData(added,"tree-item",item);
                child.tree = {
                    item: item,
                    selected: item.selected,
                    open: item.isSelected || item.isChildSelected
                };
                //dom.addClass(added,'closed');
                this.setupElement(child);
                this.listeners.push(new ClickHandler(added,
                    (event)=>{this.toggleOpen(added,item,event);}));

    
            });
 
    }

}