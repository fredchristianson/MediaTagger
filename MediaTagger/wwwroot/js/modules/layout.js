import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import { dom } from "../../drjs/browser/dom.js";
import { ZoomEvent } from "../component/view-options.js";
import {
  Listeners,
  EventListener,
  ObjectListener,
  EventEmitter,
  BuildScrollHandler,
} from "../../drjs/browser/event.js";
import Media from "./media.js";
import { OnNextLoop } from "./timer.js";

const log = Logger.create("Layout", LOG_LEVEL.INFO);

/*

    let options = {
      root: null,
      rootMargin: "0px",
      threshold: 1.0,
    };

    let observer = new IntersectionObserver(
      this.intersectionChange.bind(this),
      options)

            observer.observe(newNode);
    );*/

function px(num) {
  return `${num.toString()}px`;
}

export class Layout {
  constructor(containerSelector, list, htmlCreator) {
    this.containerSelector = containerSelector;
    this.layoutScroll = dom.createElement("div", { "@class": "layout" });
    this.layoutView = dom.createElement("div", { "@class": "layout-view" });
    this.htmlCreator = htmlCreator;
    this.list = list;
    this.scrollItemIndex = 0;
    this.scrollItemPercent = 0;
    this.zoomPercent = 1;
    this.container = dom.first(this.containerSelector);
    if (this.container == null) {
      throw new Error("Selector ", containerSelector, " not found");
    }
    dom.append(this.container, this.layoutScroll);
    dom.append(this.container, this.layoutView);

    this.resizeObserver = new ResizeObserver((entries) => {
      this.containerWidth = this.container.offsetWidth;
      this.containerHeight = this.container.offsetHeight;
      this.onContainerResize(
        this.containerWidth,
        this.containerHeight,
        entries
      );
    });
    this.resizeObserver.observe(this.container);
    this.listeners = new Listeners(
      ZoomEvent.createListener(this, this.onZoomChange),
      BuildScrollHandler().listenTo(this.container).onScroll(this).build(),
      this.list.getUpdatedEvent().createListener(this, this.onListUpdated),
      Media.getSelectedItems()
        .getUpdatedEvent()
        .createListener(this, this.onSelectionChanged)
    );

    OnNextLoop(() => {
      this.onListUpdated(this.list);
    });

    this.focusItem = null;
    this.focusIndex = -1;
    this.firstVisibleIndex = -1;
    this.lastVisibleIndex = -1;
    this.visibleItemCount = -1;
    this.itemStepCount = -1;
  }

  getNavigationStepCount() {
    return this.itemStepCount >= 0 ? this.itemStepCount : 1;
  }
  setFocus(item) {
    this.focusItem = item;
    this.ensureVisible(this.focusItem);
  }

  ensureVisible(item) {
    if (this.list == null) {
      return;
    }
    var oldFocus = dom.first(".focus");
    dom.removeClass(oldFocus, "focus");

    this.focusIndex = this.list.indexOf(this.focusItem);
    if (this.focusIndex < this.firstVisibleIndex || this.lastVisibleIndex < 0) {
      this.scrollToItem(
        this.focusIndex - this.itemStepCount,
        0,
        this.layoutView
      );
    } else if (this.focusIndex > this.lastVisibleIndex) {
      this.scrollToItem(
        this.focusIndex - this.visibleItemCount + 1,
        0,
        this.layoutView
      );
    }
    if (item && item.__layout_element) {
      dom.addClass(item.__layout_element, "focus");
    }
  }

  detach() {
    this.listeners.removeAll();
  }

  getItem(index) {
    var item = this.list.getItemAt(index);
    return item;
  }

  getItemHtml(index) {
    var item = this.list.getItemAt(index);
    if (item == null) {
      return null;
    }
    if (item.__layout_element == null) {
      var element = this.htmlCreator(item);
      item.__layout_element = element;
    }
    return item.__layout_element;
  }

  onScroll(pos) {
    this.layoutView.style.top = px(pos);
    this.layoutView.style.height = px(this.container.clientHeight);
    this.scrollItemIndex = Math.floor(pos / 100);
    this.scrollItemPercent = (pos % 100) / 100.0;
    this.scrollToItem(
      this.scrollItemIndex,
      this.scrollItemPercent,
      this.layoutView
    );
  }

  scrollToItem(itemIndex, itemPercent) {
    throw new Error("layout class must implement scrollToItem");
  }

  onSelectionChanged(list) {
    this.scrollToItem(
      this.scrollItemIndex,
      this.scrollItemPercent,
      this.layoutView
    );
  }
  onListUpdated(list) {
    this.layoutScroll.style.height = px(list.getLength() * 100);

    this.scrollToItem(
      this.scrollItemIndex,
      this.scrollItemPercent,
      this.layoutView
    );
  }

  onContainerResize(containerWidth, containerHeight, entries) {
    this.scrollToItem(
      this.scrollItemIndex,
      this.scrollItemPercent,
      this.layoutView
    );
  }

  onZoomChange(sender, newValue) {
    this.zoomPercent = newValue / 100.0;
    this.scrollToItem(
      this.scrollItemIndex,
      this.scrollItemPercent,
      this.layoutView
    );
  }

  addItem(item) {
    if (item instanceof HTMLElement) {
      this.items.push(item);
    } else {
      throw new Error("Layout can only add HTML items");
    }
    this.insertElement(item);
  }

  addItems(items) {
    dom.hide(this.container);
    items.forEach((item) => this.addItem(item));
    dom.show(this.container);
  }

  insertElement(item) {
    throw new Error("derived class must implement insertElement");
  }
}

export class GridLayout extends Layout {
  constructor(containerSelector, list, htmlCreator) {
    super(containerSelector, list, htmlCreator);
    this.itemWidth = 128;
    this.itemHeight = 128;
    this.gap = 16;
    this.zoom = 100.0;
    this.gridDataName = "data-layout-grid-visible";
  }

  scrollToItem(itemIndex, itemPercent, view) {
    var selection = Media.getSelectedItems();
    var visibleItems = Media.getVisibleItems();
    var visible = true;
    var left = 0;
    var top = 0;
    var width = this.itemWidth * this.zoomPercent;
    var height = this.itemHeight * this.zoomPercent;
    var gap = this.gap;
    var viewWidth = view.clientWidth;
    var viewHeight = view.clientHeight;
    if (viewWidth == 0 || viewHeight == 0) {
      return;
    }
    var cols = Math.floor(viewWidth / (width + gap));
    var rows = Math.floor(viewHeight / (gap + height)); // draw an extra row
    var visibleCount = cols * rows;
    if (
      itemIndex > visibleCount &&
      itemIndex + visibleCount >= this.list.getLength()
    ) {
      itemIndex = this.list.getLength() - visibleCount + 2 * cols;
      if (itemIndex < 0) {
        itemIndex = 0;
      }
    }
    var colPos = itemIndex % cols;
    // itemIndex -= colPos;
    var topOffset = (1.0 * (height + gap) * colPos) / cols;
    if (itemIndex < 0) {
      itemIndex = 0;
      topOffset = 0;
    }
    this.itemStepCount = cols;
    this.firstVisibleIndex = itemIndex;
    this.lastVisibleIndex = itemIndex + visibleCount - 1;
    this.visibleItemCount = visibleCount;
    var html = this.getItemHtml(itemIndex);
    var layoutChildren = [];
    left = this.gap / 2;
    while (visible && html != null) {
      //fragment.appendChild(html);
      layoutChildren.push(html);
      html.style.left = px(left);
      html.style.top = px(top - topOffset);
      html.style.width = px(width);
      html.style.height = px(height);
      left += width + gap;
      if (left + width + gap > viewWidth) {
        left = this.gap / 2;
        top += height + gap;
        visible = top < viewHeight + 2 * height + gap;
      }
      var item = visibleItems.getItemAt(itemIndex);
      dom.toggleClass(html, "selected", selection.contains(item));
      dom.toggleClass(html, "group", item.isInGroup());
      dom.toggleClass(html, "primary", item.isPrimary());

      itemIndex += 1;
      html = this.getItemHtml(itemIndex);
    }

    var change = true;
    var children = view.children;
    if (layoutChildren.length == children.length) {
      change = false;
      for (var i = 0; i < layoutChildren.length && !change; i++) {
        if (layoutChildren[i] != children[i]) {
          change = true;
        }
      }
    }
    if (change) {
      var fragment = document.createDocumentFragment();
      for (var child of layoutChildren) {
        fragment.appendChild(child);
      }
      view.replaceChildren(fragment);
    }
  }
}
export default GridLayout;
