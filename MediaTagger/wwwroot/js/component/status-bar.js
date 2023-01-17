import { ComponentBase } from "../../drjs/browser/component.js";
import {
  BuildCustomEventHandler,
  Listeners,
} from "../../drjs/browser/event.js";
import Media from "../modules/media.js";

export class StatusBarComponent extends ComponentBase {
  constructor(selector, htmlName = "status-bar") {
    super(selector, htmlName);
    this.listeners = new Listeners();
  }

  onHtmlInserted(parent) {
    this.totalItems = this.dom.first(".totalItems");
    this.selectedItems = this.dom.first(".selectedItems");
    this.listeners.add(
      BuildCustomEventHandler()
        .emitter(Media.getVisibleItems().getUpdatedEvent())
        .onEvent(this, this.onItemsUpdated)
        .build(),
      BuildCustomEventHandler()
        .emitter(Media.getSelectedItems().getUpdatedEvent())
        .onEvent(this, this.onSelectionUpdate)
        .build()
    );
    this.setTotalCount(Media.getVisibleItems().getLength());
    this.setSelectedCount(0);
  }

  onItemsUpdated(list) {
    this.setTotalCount(list.getLength());
  }

  onSelectionUpdate(list) {
    this.setSelectedCount(list.getLength());
  }

  setTotalCount(count) {
    this.dom.setInnerHTML(this.totalItems, count);
  }

  setSelectedCount(count) {
    this.dom.setInnerHTML(this.selectedItems, count);
  }
}

export default StatusBarComponent;
