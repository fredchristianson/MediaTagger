import { ComponentBase } from "../../drjs/browser/component.js";

import ViewOptionsComponent from "./view-options.js";
import StatusBarComponent from "./status-bar.js";
import FileViewComponent from "./file-view.js";
import SettingsComponent from "./settings.js";
import api from "../modules/mt-api.js";

export class MainComponent extends ComponentBase {
  constructor(selector, htmlName = "main") {
    super(selector, htmlName);
    MainComponent.instance = this;
  }

  async onHtmlInserted(parent) {
    this.viewOptions = new ViewOptionsComponent("#view-options");
    this.statusBar = new StatusBarComponent("#status-bar");
    var appSettings = await api.GetAppSettings();
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
}

export default MainComponent;
