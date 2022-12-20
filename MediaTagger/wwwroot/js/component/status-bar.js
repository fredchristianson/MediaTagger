import { ComponentBase } from "../../drjs/browser/component.js";
import Media from "../modules/media.js";

export class StatusBarComponent extends ComponentBase {
  constructor(selector, htmlName = "status-bar") {
    super(selector, htmlName);
  }

  onHtmlInserted(parent) {
    this.totalItems = this.dom.first(".totalItems");
    this.selectedItems = this.dom.first(".selectedItems");
    Media.getVisibleItems()
      .getUpdatedEvent()
      .createListener(this, this.onItemsUpdated);
    this.setTotalCount(Media.getVisibleItems().getLength());
    this.setSelectedCount(0);
    Media.getVisibleItems()
      .getUpdatedEvent()
      .createListener(this, "onItemsUpdated");
    Media.getSelectedItems()
      .getUpdatedEvent()
      .createListener(this, "onSelectionUpdate");
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
