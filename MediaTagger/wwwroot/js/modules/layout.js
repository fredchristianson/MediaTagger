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
import Media, { media } from "./media.js";
import { OnNextLoop } from "./timer.js";
import { Assert } from "../../drjs/assert.js";

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

class LayoutDetails {
  constructor(container, zoom = 1) {
    this.container = dom.first(container);
    Assert.notNull(this.container, "Layout requires and element");
    this.containerWidth = dom.getWidth(this.container);
    this.containerHeight = dom.getHeight(this.container);
    this.zoom = zoom;
    this.baseItemWidth = 128;
    this.baseItemHeight = 128;
    this.itemWidth = 128;
    this.itemHeight = 128;
    this.rows = 1;
    this.cols = 1;
    this.gap = 8;
    this.setItemSize(zoom, this.baseItemWidth, this.baseItemHeight);
  }

  get Columns() {
    return this.cols;
  }
  get Rows() {
    return this.rows;
  }
  get ItemHeight() {
    return this.itemHeight;
  }
  get ItemWidth() {
    return this.itemWidth;
  }

  get RowHeight() {
    return this.itemHeight + this.gap;
  }

  get ViewWidth() {
    return this.containerWidth;
  }

  get ViewHeight() {
    return this.containerHeight;
  }

  get Gap() {
    return this.gap;
  }

  get Zoom() {
    return this.zoom;
  }
  setZoom(zoom) {
    this.setItemSize(zoom);
  }

  setItemSize(zoom = 1, baseItemWidth = null, baseItemHeight = null) {
    this.zoom = zoom ?? 1;
    this.baseItemWidth = baseItemWidth ?? 128;
    this.baseItemHeight = baseItemHeight ?? 128;
    this.itemHeight = this.zoom * this.baseItemHeight;
    this.itemWidth = this.zoom * this.baseItemWidth;
    this.calcFit();
  }

  calcFit() {
    if (this.containerWidth == 0) {
      this.cols = 1;
    } else {
      this.cols = Math.floor(this.containerWidth / (this.itemWidth + this.gap));
    }
    if (this.containerHeight == 0) {
      this.rows = 1;
    } else {
      // draw one extra row for partial scroll
      this.rows = Math.floor(
        this.containerHeight / (this.itemHeight + this.gap)
      );
    }
    this.visibleCount = this.rows * this.cols;
    this.pageSize = (this.rows - 2) * this.cols;
  }

  get VisibleRows() {
    return this.rows;
  }
}

export class Layout {
  constructor(containerSelector, list, htmlCreator) {
    this.containerSelector = containerSelector;
    this.container = dom.first(this.containerSelector);
    this.layoutScroll = dom.first(this.container, ".view"); // dom.createElement("div", { "@class": "layout" });
    this.layoutView = dom.first(this.container, ".view"); //dom.createElement("div", { "@class": "layout-view" });
    this.htmlCreator = htmlCreator;
    this.list = list;

    this.zoomPercent = 1;
    if (this.container == null) {
      throw new Error("Selector ", containerSelector, " not found");
    }
    this.resizeObserver = new ResizeObserver(this.onContainerResize.bind(this));
    this.resizeObserver.observe(this.container);
    this.listeners = new Listeners(
      ZoomEvent.createListener(this, this.onZoomChange),
      BuildScrollHandler().listenTo(this.layoutScroll).onScroll(this).build(),
      this.list.getUpdatedEvent().createListener(this, this.onListUpdated),
      Media.getSelectedItems()
        .getUpdatedEvent()
        .createListener(this, this.onSelectionChanged),
      Media.getFocusChangeEvent().createListener(this, this.setFocus)
    );

    OnNextLoop(() => {
      this.onListUpdated(this.list);
    });

    this.firstVisibleIndex = 0;
    this.layoutDetails = this.createLayoutDetails();
  }

  createLayoutDetails() {
    return new LayoutDetails(this.layoutView, this.zoomPercent);
  }

  getNavigationStepCount() {
    return this.layoutDetails.Columns;
  }

  setFocus(sender, item) {
    var oldFocus = dom.first(".focus");
    dom.removeClass(oldFocus, "focus");
    var focusItem = item;
    if (item != null) {
      this.ensureVisible(focusItem);
    }
    if (item != null && item.__layout_element) {
      dom.addClass(item.__layout_element, "focus");
    }
    this.drawItems(this.firstVisibleIndex, this.layoutDetails, this.layoutView);
  }

  redrawItem(item) {
    this.ensureVisible(item);
    this.drawItems(this.firstVisibleIndex, this.layoutDetails, this.layoutView);
  }
  ensureVisible(item) {
    if (this.list == null || this.list.Length == 0) {
      return;
    }
    var index = this.list.indexOf(item);
    var itemCount = this.list.Length;
    var scrollHeight = this.layoutScroll.scrollHeight;
    var scrollTop = this.layoutScroll.scrollTop;
    var scrollPercent = scrollTop / scrollHeight;
    var viewHeight = this.layoutView.offsetHeight;
    var totalRows = Math.floor(itemCount / this.layoutDetails.Columns) + 1;
    var itemRow = Math.floor(index / this.layoutDetails.Columns);
    var scrollPos = this.layoutScroll.scrollTop;
    var firstVisibleRow = Math.floor(scrollPercent * totalRows);
    var lastVisibleRow = firstVisibleRow + this.layoutDetails.VisibleRows - 1;

    if (itemRow <= firstVisibleRow) {
      firstVisibleRow = itemRow;
      this.scrollToRow(firstVisibleRow);
    } else if (itemRow > lastVisibleRow) {
      firstVisibleRow = itemRow - this.layoutDetails.VisibleRows + 2;
      this.scrollToRow(firstVisibleRow);
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
    var totalRows =
      Math.floor(media.getVisibleItems().Length / this.layoutDetails.Columns) +
      1;

    var rowPercent = pos / this.layoutScroll.scrollHeight;
    var row = Math.floor(totalRows * (rowPercent + 0.0005)); // add .0005 for rounding error in percent
    this.firstVisibleIndex = row * this.layoutDetails.Columns;
    this.drawItems(this.firstVisibleIndex, this.layoutDetails, this.layoutView);
  }

  scrollToRow(row) {
    this.firstVisibleIndex = row * this.layoutDetails.Columns;
    this.layoutScroll.scrollTo(0, row * this.layoutDetails.RowHeight);
    //this.drawItems(this.firstVisibleIndex, this.layoutDetails, this.layoutView);
  }

  onSelectionChanged(list) {
    this.drawItems(this.firstVisibleIndex, this.layoutDetails, this.layoutView);
  }

  onListUpdated(list) {
    this.onContainerResize();
  }

  onContainerResize() {
    this.layoutDetails = this.createLayoutDetails();

    var totalRows = this.list.Length / this.layoutDetails.Columns + 1;
    var totalHeight = totalRows * this.layoutDetails.RowHeight;
    //this.layoutScroll.style.height = px(totalHeight);
    this.setScrollHeight(totalHeight);
    var item = media.getFocus();
    if (item) {
      this.ensureVisible(item);
    }
    this.drawItems(this.firstVisibleIndex, this.layoutDetails, this.layoutView);
  }

  setScrollHeight(height) {
    var bottom = dom.first(this.layoutScroll, ".bottom");
    if (bottom == null) {
      bottom = dom.createElement("div", {
        class: "bottom",
        style: "position:absolute;width:1px;height:1px",
      });
      dom.append(this.layoutScroll, bottom);
    }
    bottom.style.top = px(height);
  }

  onZoomChange(sender, newValue) {
    this.zoomPercent = newValue / 100.0;
    this.onContainerResize();
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

  drawItems(firstItemIndex, layoutDetails, view) {
    if (firstItemIndex < 0) {
      firstItemIndex = 0;
    }
    var selection = Media.getSelectedItems();
    var visibleItems = Media.getVisibleItems();
    var visible = true;
    var left = 0;
    var top = view.scrollTop;
    var viewBottom = view.scrollTop + view.clientHeight;
    var width = layoutDetails.ItemWidth;
    var height = layoutDetails.ItemHeight;
    var gap = layoutDetails.Gap;
    var viewWidth = layoutDetails.ViewWidth;
    var viewHeight = layoutDetails.ViewHeight;
    if (viewWidth == 0 || viewHeight == 0) {
      return;
    }
    var cols = layoutDetails.Columns;
    var rows = layoutDetails.Rows;

    this.itemStepCount = cols;
    var itemIndex = firstItemIndex;
    var html = this.getItemHtml(itemIndex);
    var layoutChildren = [];
    left = gap / 2;
    while (visible && html != null) {
      //fragment.appendChild(html);
      layoutChildren.push(html);
      html.style.left = px(left);
      html.style.top = px(top);
      html.style.width = px(width);
      html.style.height = px(height);
      left += width + gap;
      if (left + width + gap >= viewWidth) {
        left = gap / 2;
        top += height + gap;
        visible = top < viewBottom;
      }
      var item = visibleItems.getItemAt(itemIndex);
      dom.toggleClass(html, "selected", selection.contains(item));
      dom.toggleClass(html, "group", item.isInGroup());
      dom.toggleClass(html, "primary", item.isPrimary());

      dom.removeClass(html, [`rotate-90`, "rotate-180", "rotate-270"]);
      if (item.RotationDegrees) {
        dom.addClass(html, `rotate-${(item.RotationDegrees + 360) % 360}`);
      }
      if (item.RotationDegrees == 90 || item.RotationDegrees == 270) {
        dom.addClass(img, "portrait");
      } else {
        dom.addClass(img, "landscape");
      }
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
      var bottom = dom.first(view, ".bottom");
      view.replaceChildren(fragment);
      dom.append(view, bottom);

      // position top margin after image has been inserted into the body DOM
      // before then the <img> has 0 size
      for (var img of dom.find(view, "img")) {
        var imgHeight = height;
        if (dom.hasClass(img, "portrait")) {
          imgHeight = dom.getWidth(img);
        } else {
          imgHeight = dom.getHeight(img);
        }
        const margin = (height - imgHeight) / 2;
        img.style.top = px(margin);
      }
    }
  }
}
export default GridLayout;
