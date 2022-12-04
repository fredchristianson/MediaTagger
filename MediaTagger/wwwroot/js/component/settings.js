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
}

export class SettingsComponent extends ComponentBase{
    constructor(selector, htmlName='settings') {
        super(selector,htmlName);
    }

    async onHtmlInserted(parent) {
        this.settings = await API.GetAppSettings();

        this.setValue("[name='thumbnailDirectory'",this.settings.storageDirectory);

        this.tree = new Tree(this.dom.first('.tree.folders'),new FolderTreeData());
    }

}

export default SettingsComponent;