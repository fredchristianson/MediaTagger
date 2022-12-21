import { ComponentBase } from "../../drjs/browser/component.js";
import { HtmlTemplate } from "../../drjs/browser/html-template.js";
import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import { Listeners } from "../../drjs/browser/event.js";
import Media from "../modules/media.js";
import { ObservableArray } from "../modules/collections.js";
import { BackgroundTask } from "../../drjs/browser/task.js";
const log = Logger.create("MediaComponent", LOG_LEVEL.DEBUG);

class FileGroup {
  constructor() {}
}

export class FindGroupsComponent extends ComponentBase {
  constructor(selector, htmlName = "find-groups") {
    super(selector, htmlName);
    this.groups = new ObservableArray();
    this.listeners = new Listeners();
    this.task = null;
  }

  async onGroupsUpdated(list) {
    this.dom.setInnerHTML(".group-count", list.length);
  }

  async onHtmlInserted(elements) {
    var template = new HtmlTemplate(this.dom.first("#create-group-template"));

    this.listeners.add(
      this.groups.updatedEvent.createListener(this, this.onGroupsUpdated)
    );
    this.allFiles = await Media.getAllFiles();

    this.task = BackgroundTask.batch(
      1000,
      this.allFiles,
      this.analyzeFile.bind(this)
    );
  }

  analyzeFile(file) {
    log.debug("analyze ", file.getId());
  }

  async onDetach() {
    if (this.task) {
      this.task.cancel();
    }
    this.listeners.removeAll();
  }
}

export default FindGroupsComponent;
