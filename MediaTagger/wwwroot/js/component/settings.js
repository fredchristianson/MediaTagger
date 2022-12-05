import {ComponentBase} from '../../drjs/browser/component.js';
import API from '../mt-api.js';
import {Tree, TreeDataProvider, TreeItem} from '../controls/tree.js'


class FolderTreeData extends TreeDataProvider {
    constructor(containerElement) {
        super(containerElement);
    }

    async getTopItems(){
        this.folders = await API.GetTopFolders();
        var items = this.folders.map(folder=>{
            var item = new TreeItem(folder.name,true);
            item.data = folder;
            return item;
        });
        return items;
    }

    async getChildren(item) {
        var folders = await API.GetFolders(item.data.path);
        var items = folders.map(folder=>{
            var item = new TreeItem(folder.name,false);
            item.data = folder;
            return item;
        });
        item.children = items;
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