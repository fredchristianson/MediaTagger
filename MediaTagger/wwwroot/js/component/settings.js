import {ComponentBase} from '../../drjs/browser/component.js';
import API from '../mt-api.js';
import {Tree, TreeDataProvider, TreeItem} from '../controls/tree.js'
import { LOG_LEVEL, Logger } from '../../drjs/logger.js';
const log = Logger.create("Settings", LOG_LEVEL.DEBUG);

class FolderTreeData extends TreeDataProvider {
    constructor(containerElement) {
        super(containerElement);
    }

    async getTopItems(){
        this.folders = await API.GetTopFolders();
        var items = this.folders.map(folder=>{
            var item = new TreeItem(folder.name,null,true);
            item.data = folder;
            return item;
        });
        return items;
    }

    async getChildren(parent) {
        var folders = [];
        try {
            folders = await API.GetFolders(parent.data.path);
        } catch(ex) {
            log.error("cannot get child folders for ",parent.data.path);
            return [];
        }
        var items = folders.map(folder=>{
            var item = new TreeItem(folder.name,parent,false);
            item.data = folder;
            return item;
        });
        parent.allChildren = items;
        parent.children = items.filter(item=>{ return item.name[0] != '$' && item.name[0] != '.';});
        return items;        
    }
}

export class SettingsComponent extends ComponentBase{
    constructor(selector, htmlName='settings') {
        super(selector,htmlName);
    }

    onDetach() {
        if (this.tree) {
            this.tree.detach();
            this.tree = null;
        }
    }

    async onHtmlInserted(parent) {
        this.settings = await API.GetAppSettings();

        this.setValue("[name='thumbnailDirectory'",this.settings.storageDirectory);
        this.setValue("[name='mediaExtensions'",this.settings.mediaExtensions);

        this.tree = new Tree(this.dom.first('.tree.folders'),new FolderTreeData());
    }

}

export default SettingsComponent;