import dom, { DOM } from '../../drjs/browser/dom.js';
import HtmlTemplate from '../../drjs/browser/html-template.js';
import { LOG_LEVEL, Logger } from '../../drjs/logger.js';
const log = Logger.create("Tree", LOG_LEVEL.DEBUG);
import {Listeners, BuildClickHandler, BuildInputHandler} from "../../drjs/browser/event.js";

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
    constructor(name,parent, isTop=false) {
        this.name = name;
        this.parent = parent;
        this.type = TREE_ITEM_TYPE.NODE;
        this.isTop = isTop;
        this.children = null;
        this.isSelected = false;
        this.isChildSelected = false;
    }

    hasSelectedParent(){
        var p = this.parent;
        while(p !=null) {
            if (p.isSelected) {
                return true;
            }
            p = p.parent;
        }
        return false;
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
            item.element = element;
            //dom.addClass(added,'closed');
            this.setupElement(element);
            this.addClickHandler(added,item);

        });
    }

    addClickHandler(element,item) {
        this.listeners.push(BuildClickHandler()
        .listenTo(element)
        .setHandler(this,this.toggleOpen)
        .exclude('input')
        .setData(item)
        .build(),
        BuildInputHandler()
        .listenTo(dom.first(element,'input[type="checkbox"]'))
        .onChange(this,this.checkChange)
        .onFocus(this)
        .onBlur(this)
        .setData(item)
        .build()
        );
    }   

    checkChange(checkbox,item,event,handler) {
        item.isSelected = dom.getProperty(checkbox,"checked");
        var checks = dom.find(item.element,'.children input[type="checkbox"]');
        dom.setProperty(checks,'checked',item.isSelected);
        dom.setProperty(checks,'disabled',item.isSelected);
        
    }
    
    onFocus(checkbox,item,event,handler) {
        log.debug("checkbox focus ");
    }
    
    onBlur(checkbox,item,event,handler) {
        log.debug("checkbox blur ");
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
            try {
                await this.getChildren(element,treeData);
            } catch(ex){
                log.error(ex,"unable to get children");
            }
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
                added.tree = {
                    item: item,
                    selected: item.selected,
                    open: item.isSelected || item.isChildSelected
                };
                item.element = added;
                if (item.hasSelectedParent()) {
                    var check = dom.first(added,'input[type="checkbox"]');
                    dom.setProperty(check,'checked',true);
                    dom.setProperty(check,'disabled',true);
                }
                //dom.addClass(added,'closed');
                this.setupElement(added);
                this.addClickHandler(added,item);

    
            });
 
    }

}