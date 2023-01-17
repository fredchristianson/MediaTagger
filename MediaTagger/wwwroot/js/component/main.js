import { ComponentBase } from "../../drjs/browser/component.js";
import { watcher as settingsWatcher } from "../modules/setting-watcher.js";
import ViewOptionsComponent from "./view-options.js";
import StatusBarComponent from "./status-bar.js";
import FileViewComponent from "./file-view.js";
import { TagManagerComponent } from "./tag-manager-component.js";
import { QuickTagsComponent } from "./quick-tags-component.js";
import SettingsComponent from "./settings.js";
import { getAppSettings } from "../modules/mt-api.js";
import { DOMWatcher, toggleClass } from "../modules/dom-watcher.js";
export class MainComponent extends ComponentBase {
  constructor(selector, htmlName = "main") {
    super(selector, htmlName);
    MainComponent.instance = this;
    this.domWatcher = new DOMWatcher();
    this.domWatcher.addClickAction(
      ".toggle-next-sibling",
      toggleClass("hide-next-sibling")
    );
  }

  async onHtmlInserted(parent) {
    this.settingsWatcher = settingsWatcher;
    await this.settingsWatcher.init();
    this.viewOptions = new ViewOptionsComponent("#view-options");
    this.statusBar = new StatusBarComponent("#status-bar");

    var appSettings = await getAppSettings();
    if (
      appSettings != null &&
      appSettings.mediaDirectories != null &&
      appSettings.mediaDirectories.length > 0
    ) {
      if (location.hash == "#quick-tags") {
        this.showQuickTags();
      } else {
        this.showFiles();
      }
    } else {
      this.showSettings();
    }
  }
  showSettings() {
    this.contentView = new SettingsComponent("#content-view");
  }

  showFiles() {
    location.hash = "#file-view";
    this.contentView = new FileViewComponent("#content-view");
  }

  showTagManager() {
    this.contentView = new TagManagerComponent("#content-view");
  }

  showQuickTags() {
    location.hash = "#quick-tags";
    this.contentView = new QuickTagsComponent("#content-view");
  }
}

export default MainComponent;
