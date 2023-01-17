import { ComponentBase } from "../../drjs/browser/component.js";
import {
  HtmlTemplate,
  ReplaceTemplateValue,
  DataValue,
  AttributeValue,
} from "../../drjs/browser/html-template.js";
import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import {
  Listeners,
  BuildClickHandler,
  BuildKeyHandler,
  BuildScrollHandler,
  BuildFocusHandler,
  Continuation,
  BuildMouseHandler,
  BuildCustomEventHandler,
} from "../../drjs/browser/event.js";
import MediaDetailsComponent from "./media-details.js";
import DateFilterComponent from "./date-filter.js";
import MediaFilterComponent from "./media-filter.js";
import Media, {
  FilterChangeEvent,
  FocusChangeEvent,
  media,
} from "../modules/media.js";
import { Navigation } from "../modules/navigation.js";
import { GridLayout } from "../modules/layout.js";
import { RightGridSizer, LeftGridSizer } from "../modules/drag-drop.js";

import UTIL from "../../drjs/util.js";

import { ZoomEvent } from "../component/view-options.js";

import { ImageLoader } from "../modules/image-loader.js";
import MediaFileEditorComponent from "./media-file-editor.js";
import { MouseHandler } from "../../drjs/browser/event-handler/mouse-handler.js";

const log = Logger.create("FileView", LOG_LEVEL.DEBUG);
const navigationKeys = [
  "Escape",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "F1",
  "F2",
  "F3",
  "F4",
  "F5",
  "F6",
  "F7",
  "F8",
  "F9",
  "End",
  "Home",
  "PageUp",
  "PageDown",
  "[",
  "]",
  "\\",
];

export class FileViewComponent extends ComponentBase {
  constructor(selector, htmlName = "media") {
    super(selector, htmlName);
    this.listeners = new Listeners();
    this.activeItem = null;
  }

  async onHtmlInserted(elements) {
    this.imageLoader = new ImageLoader(".media-items");
    this.mediaDetails = new MediaDetailsComponent("#media-details");
    this.dateFilter = new DateFilterComponent("#date-filter");
    this.mediaFilter = new MediaFilterComponent("#media-filter");
    this.popup = this.dom.first(".file.popup");
    this.filterSizer = new RightGridSizer(".grid-sizer.right", ".media-filter");
    this.detailsSizer = new LeftGridSizer(".grid-sizer.left", ".media-details");
    var allItems = await Media.getVisibleItems();
    this.template = new HtmlTemplate(this.dom.first("#media-item-template"));

    this.editorElement = this.dom.createElement(
      "<div id='media-file-editor-container'></div>"
    );
    this.dom.hide(this.editorElement);
    this.dom.append(document.body, this.editorElement);
    this.editor = new MediaFileEditorComponent(this.editorElement);
    this.layout = new GridLayout(
      ".items",
      allItems,
      this.createItemElement.bind(this)
    );
    this.listeners.add(
      BuildClickHandler()
        .listenTo(this.dom, ".media-item")
        .onClick(this, this.clickItem)
        .onLeftClick(this, this.leftClick)
        .onRightClick(this, this.rightClick)
        .onMiddleClick(this, this.middleClick)
        .setData((element) => {
          return {
            item: Media.getAllFiles().findById(
              this.dom.getData(element, "file-id")
            ),
          };
        })
        .build(),
      BuildClickHandler()
        .listenTo(".popup")
        .selector("a.view")
        .onClick(this, this.viewFile)
        .build(),
      BuildClickHandler()
        .listenTo(".popup")
        .selector("button.group")
        .onClick(this, this.groupSelectedItems)
        .build(),
      BuildClickHandler()
        .listenTo(".popup")
        .selector("button.ungroup")
        .onClick(this, this.ungroupItem)
        .build(),
      BuildMouseHandler().onMouseDown(this, this.checkCancel).build(),
      BuildKeyHandler()
        .filterAllow(this.filterKeyEvent.bind(this))
        .onKeyDown(this, this.onKeypress)
        .build(),
      BuildCustomEventHandler()
        .emitter(ZoomEvent)
        .onEvent(this, this.hidePopup).build(),
      BuildScrollHandler()
        .listenTo(".items")
        .onScroll(this, this.hidePopup)
        .build(),
      // BuildFocusHandler()
      //   .listenTo(document.body)
      //   .onFocusIn(this, this.clearItemFocus)
      //   .onBlur(this, this.clearFocus)
      //   .build(),
      BuildCustomEventHandler().emitter(FocusChangeEvent).onEvent(this, this.hidePopup).build()
    );

    this.navigation = new Navigation(this.layout);
    this.isEditorVisible = false;
  }

  checkCancel(position, target, event) {
    if (
      this.isEditorVisible &&
      !this.dom.contains(this.editorElement, event.target)
    ) {
      this.dom.hide(this.editorElement);
      this.isEditorVisible = false;
    }
  }
  filterKeyEvent(event) {
    const active = document.activeElement;
    if (active == document.body) {
      return true;
    }
    if (this.dom == null) {
      alert("something is wrong");
      return;
    }
    return this.dom.contains(active);
  }
  createItemElement(item) {
    var htmlItem = this.template.fill({
      ".media-item": [new DataValue("file-id", item.getId())],
      ".thumbnail": [
        new DataValue("file-id", item.getId()),
        new AttributeValue("src", `/thumbnail/${item.getId()}?v=7`),
      ],
    });
    return htmlItem;
  }

  // remove focus from file item if another control (e.g. input) gets focus
  clearItemFocus() {
    media.clearFocus();
    this.hidePopup();
  }

  async groupSelectedItems() {
    log.debug("group selected items");
    Media.groupSelectedItems(this.activeItem);
    this.hidePopup();
  }

  async ungroupItem() {
    log.debug("ungroup item");
    Media.ungroup(this.activeItem);
    this.hidePopup();
  }

  async onDetach() {
    this.imageLoader.stop();
    this.layout.detach();
    this.listeners.removeAll();
    if (this.editor) {
      this.editor.detach();
    }
  }

  clickItem(data, element, event, handler) {
    if (document.activeElement) {
      document.activeElement.blur();
    }
  }
  leftClick(data, element, event, handler) {
    log.debug("leftClick element ");
    if (event.hasShift) {
      Media.selectToItem(data.item);
    } else if (event.hasCtrl) {
      Media.toggleSelectItem(data.item);
    } else {
      Media.selectItem(data.item);
    }
  }
  rightClick(data, element, event, handler) {
    this.layout.setFocus(data.item);
    Media.selectToItem(data.item);
  }
  middleClick(data, element, event, handler) {
    this.layout.setFocus(data.item);
    Media.toggleSelectItem(data.item);
  }

  isNavigationKey(key) {
    return key == null || navigationKeys.includes(key);
  }

  showPopup() {
    const focus = this.dom.first(".focus");
    if (focus == null) {
      return;
    }
    this.item = media.getFocus();
    const rect = this.dom.getPageOffset(focus);
    const mediaRect = this.dom.getPageOffset(".media-items");
    const bodyWidth = document.body.clientWidth;

    var width = this.dom.getWidth();
    var left = "unset";
    var right = width - rect.left;
    var top = mediaRect.top;
    if (right > rect.left) {
      left = rect.right;
      right = "unset";
    }
    var style = {
      left: left,
      right: right,
      top: top,
    };
    this.editor.setItem(focus);
    this.dom.setStyle(this.editorElement, style);
    this.dom.show(this.editorElement);
    this.isEditorVisible = true;
  }

  hidePopup() {
    if (this.item == media.getFocus()) {
      return;
    }
    this.dom.hide(this.editorElement);
    this.isEditorVisible = false;
  }

  onKeypress(key, target, event) {
    log.debug("focusIndex ", media.getFocusIndex());
    if (this.isEditorVisible && key == "Escape") {
      this.hidePopup();
      media.clearSelection();
      media.clearFocus();
      const focusIndex = media.getFocusIndex();

      FilterChangeEvent.emit();

      setTimeout(() => {
        media.getLastFocusIndex(focusIndex);
      }, 100);
      this.navigation.changeIndex(1);
      return Continuation.StopAll;
    }
    log.debug("key ", key);
    if (this.isNavigationKey(key) || media.getFocus() == null) {
      this.hidePopup();
      return;
    }
    if (!this.isEditorVisible) {
      this.showPopup();
    }
    if (event.hasAlt) {
      this.editor.altKey(key);
    } else if (event.hasCtrl) {
      this.editor.ctrlKey(key);
    } else {
      this.editor.searchKey(key, event.hasShift);
    }
    return Continuation.PreventDefault;
  }
}

export default FileViewComponent;
