import { ComponentBase } from '../../drjs/browser/component.js';
import {
  getAppSettings,
  postAppSettings,
  getTopFolders,
  getFolders
} from '../modules/mt-api.js';
import { Tree, TreeDataProvider, TreeItem } from '../controls/tree.js';
import {media}  from '../modules/media.js';
import {
  Listeners,
  BuildInputHandler,
  BuildClickHandler
} from '../../drjs/browser/event.js';
import { LOG_LEVEL, Logger } from '../../drjs/logger.js';
const log = Logger.create('Settings', LOG_LEVEL.DEBUG);

class FolderTreeData extends TreeDataProvider {
  constructor() {
    super();
    this.topItems = null;
  }

  async setSelectedFolders(folders) {
    await this.getTopItems();
    if (folders == null) {
      return;
    }
    for (let idx in folders) {
      await this.loadFolder(folders[idx], this.topItems);
    }
  }

  async loadFolder(folder, parentList) {
    let path = folder.split('\\');
    path[0] = path[0] + '\\'; // drive name includes slash
    let currentFolders = parentList;
    while (path.length > 1) {
      let parent = currentFolders.find((p) => {
        return (
          p.name.localeCompare(path[0], undefined, { sensitivity: 'accent' }) ==
          0
        );
      });
      if (parent == null) {
        log.error('path part not found ', path[0]);
        return;
      }
      parent.isOpen = true;
      currentFolders = await this.getChildren(parent);
      path.shift();
    }
    if (path.length == 1) {
      let sel = currentFolders.find((p) => {
        return (
          p.name.localeCompare(path[0], undefined, { sensitivity: 'accent' }) ==
          0
        );
      });
      if (sel) {
        sel.isSelected = true;
      }
    }
  }

  async getTopItems() {
    if (this.topItems) {
      return this.topItems;
    }
    this.folders = await getTopFolders();
    let items = this.folders.map((folder) => {
      let item = new TreeItem(folder.name, null, folder.path, true);
      item.data = folder;
      return item;
    });
    this.topItems = items;
    return items;
  }

  async getChildren(parent) {
    if (parent.children != null) {
      return parent.children;
    }
    let folders = [];
    try {
      log.debug('get subfolders ', parent.data.path);
      folders = await getFolders(parent.data.path);
    } catch (ex) {
      log.error('cannot get child folders for ', parent.data.path);
      folders = [];
    }
    let items = folders.map((folder) => {
      let item = new TreeItem(folder.name, parent, folder.path, false);
      item.data = folder;
      return item;
    });
    parent.allChildren = items;
    parent.children = items.filter((item) => {
      return item.name[0] != '$' && item.name[0] != '.';
    });
    return items;
  }
}

export class SettingsComponent extends ComponentBase {
  constructor(selector, htmlName = 'settings') {
    super(selector, htmlName);
    this.listeners = new Listeners();
  }

  onDetach() {
    if (this.tree) {
      this.tree.detach();
      this.tree = null;
    }
    this.listeners.removeAll();
  }

  async onHtmlInserted(parent) {
    this.settings = await getAppSettings();

    this.setValue(
      "[name='thumbnailDirectory']",
      this.settings.storageDirectory
    );
    this.setValue("[name='mediaExtensions']", this.settings.mediaExtensions);
    this.treeData = new FolderTreeData();
    await this.treeData.setSelectedFolders(this.settings.mediaDirectories);
    this.tree = new Tree(this.dom.first('.tree.folders'), this.treeData);
    await this.tree.fillTopItems();
    this.dom.addClass('.buttons button', 'invisible');
    this.showSelected();
    this.listeners.push(
      BuildInputHandler().listenTo(this.dom).onChange(this).build(),
      BuildClickHandler()
        .listenTo(this.dom)
        .selector('button[name="save"]')
        .onClick(this, this.onSave)
        .build(),
      BuildClickHandler()
        .listenTo(this.dom)
        .selector('button[name="reset"]')
        .onClick(this, this.onReset)
        .build()
    );
  }

  async onSave() {
    let settings = {
      storageDirectory: this.dom.getValue("[name='thumbnailDirectory']"),
      mediaExtensions: this.dom.getValue("[name='mediaExtensions']"),
      mediaDirectories: this.tree.getSelectedValues()
    };
    await postAppSettings(settings);

    this.dom.addClass('.buttons button', 'invisible');
  }

  async onReset() {
    this.treeData = new FolderTreeData();
    await this.treeData.setSelectedFolders(this.settings.mediaDirectories);
    await this.tree.setDataProvider(this.treeData);
    this.setValue("[name='thumbnailDirectory'", this.settings.storageDirectory);
    this.setValue("[name='mediaExtensions'", this.settings.mediaExtensions);
    this.dom.addClass('.buttons button', 'invisible');
  }

  onChange() {
    this.dom.removeClass('.buttons button', 'invisible');
    this.showSelected();
  }

  showSelected() {
    let selected = this.tree.getSelectedValues();
    let ul = this.dom.first('.selected ul');
    this.dom.removeChildren(ul);
    selected.forEach((sel) => {
      this.dom.append(ul, this.dom.createElement('li', sel));
    });
  }
}

export default SettingsComponent;
