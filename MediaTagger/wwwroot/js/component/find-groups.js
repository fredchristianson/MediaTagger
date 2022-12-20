import { ComponentBase } from "../../drjs/browser/component.js";
import {
  HtmlTemplate,
  ReplaceTemplateValue,
  DataValue,
} from "../../drjs/browser/html-template.js";
import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import {
  Listeners,
  BuildClickHandler,
  BuildMouseOverHandler,
} from "../../drjs/browser/event.js";
import MediaDetailsComponent from "./media-details.js";
import DateFilterComponent from "./date-filter.js";
import MediaFilterComponent from "./media-filter.js";
import Media from "../modules/media.js";
import { GridLayout } from "../modules/layout.js";
import UTIL from "../../drjs/util.js";
import asyncLoader from "../modules/async-loader.js";
import { ObservableArray } from "../modules/collections.js";

const log = Logger.create("MediaComponent", LOG_LEVEL.DEBUG);

class FileGroup {
  constructor() {}
}

export class FindGroupsComponent extends ComponentBase {
  constructor(selector, htmlName = "find-groups") {
    super(selector, htmlName);
    this.groups = new ObservableArray();
    this.listeners = new Listeners(
      this.groups.updatedEvent.createListener(this, this.onGroupsUpdated())
    );
  }

  async onGroupsUpdated(list) {
    this.dom.setInnerHTML(".group-count", list.length);
  }

  async onHtmlInserted(elements) {
    var allItems = await Media.getAllFiles();
    var template = new HtmlTemplate(this.dom.first("#create-group-template"));

    this.listeners.add();
  }

  async onDetach() {
    this.listeners.removeAll();
  }
}

export default FindGroupsComponent;
