import { ComponentBase } from "../../drjs/browser/component.js";
import { watcher as settingsWatcher } from "../modules/setting-watcher.js";
import ViewOptionsComponent from "./view-options.js";
import StatusBarComponent from "./status-bar.js";
import FileViewComponent from "./file-view.js";
import FindGroupsComponent from "./find-groups.js";
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
      this.showFiles();
    } else {
      this.showSettings();
    }
  }
  showSettings() {
    this.contentView = new SettingsComponent("#content-view");
  }

  showFiles() {
    this.contentView = new FileViewComponent("#content-view");
  }

  findGroups() {
    this.contentView = new FindGroupsComponent("#content-view");
  }
}

export default MainComponent;
