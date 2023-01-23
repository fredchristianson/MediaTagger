import { LOG_LEVEL, Logger } from '../../drjs/logger.js';
import { dom } from '../../drjs/browser/dom.js';
import { ZoomEvent } from '../component/view-options.js';
import {
  Listeners,
  BuildScrollHandler,
  BuildCustomEventHandler
} from '../../drjs/browser/event.js';
import Media, { media } from './media.js';
import { OnNextLoop } from './timer.js';
import { Assert } from '../../drjs/assert.js';
const log = Logger.create('Layout', LOG_LEVEL.INFO);

function px(num) {
  return `${num.toString()}px`;
}

class LayoutDetails {
  constructor(container, zoom = 1) {
    this.container = dom.first(container);
    Assert.notNull(this.container, 'Layout requires and element');
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
    log.debug('create Layout');
    this.containerSelector = containerSelector;
    this.container = dom.first(this.containerSelector);
    this.layoutScroll = dom.first(this.container, '.view'); // dom.createElement("div", { "@class": "layout" });
    this.layoutView = dom.first(this.container, '.view'); //dom.createElement("div", { "@class": "layout-view" });
    this.htmlCreator = htmlCreator;
    this.list = list;

    this.zoomPercent = 1;
    if (this.container == null) {
      throw new Error('Selector ', containerSelector, ' not found');
    }
    this.resizeObserver = new ResizeObserver(this.onContainerResize.bind(this));
    this.resizeObserver.observe(this.container);
    this.listeners = new Listeners(
      BuildCustomEventHandler()
        .emitter(ZoomEvent)
        .onEvent(this, this.onZoomChange)
        .build(),
      BuildScrollHandler().listenTo(this.layoutScroll).onScroll(this).build(),

      BuildCustomEventHandler()
        .emitter(this.list.getUpdatedEvent())
        .onEvent(this, this.onListUpdated)
        .build(),

      BuildCustomEventHandler()
        .emitter(Media.getSelectedItems().getUpdatedEvent())
        .onEvent(this, this.onSelectionChanged)
        .build(),

      BuildCustomEventHandler()
        .emitter(Media.getFocusChangeEvent())
        .onEvent(this, this.setFocus)
        .build()
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

  setFocus(item) {
    let oldFocus = dom.first('.focus');
    dom.removeClass(oldFocus, 'focus');
    let focusItem = item;
    if (item != null) {
      this.ensureVisible(focusItem);
    }
    if (item != null && item._layoutElement) {
      dom.addClass(item._layoutElement, 'focus');
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
    let index = this.list.indexOf(item);
    let itemCount = this.list.Length;
    let scrollHeight = this.layoutScroll.scrollHeight;
    let scrollTop = this.layoutScroll.scrollTop;
    let scrollPercent = scrollTop / scrollHeight;
    let totalRows = Math.floor(itemCount / this.layoutDetails.Columns) + 1;
    let itemRow = Math.floor(index / this.layoutDetails.Columns);
    let firstVisibleRow = Math.floor(scrollPercent * totalRows);
    let lastVisibleRow = firstVisibleRow + this.layoutDetails.VisibleRows - 1;

    if (itemRow <= firstVisibleRow) {
      firstVisibleRow = itemRow;
      this.scrollToRow(firstVisibleRow);
    } else if (itemRow > lastVisibleRow) {
      firstVisibleRow = itemRow - this.layoutDetails.VisibleRows + 2;
      this.scrollToRow(firstVisibleRow);
    }
  }

  detach() {
    log.debug('detach Layout');
    this.listeners.removeAll();
  }

  getItem(index) {
    let item = this.list.getItemAt(index);
    return item;
  }

  getItemHtml(index) {
    let item = this.list.getItemAt(index);
    if (item == null) {
      return null;
    }
    if (item._layoutElement == null) {
      let element = this.htmlCreator(item);
      item._layoutElement = element;
    }
    return item._layoutElement;
  }

  onScroll(_target, _event) {
    let pos = this.layoutScroll.scrollTop;
    let totalRows =
      Math.floor(media.getVisibleItems().Length / this.layoutDetails.Columns) +
      1;

    let rowPercent = pos / this.layoutScroll.scrollHeight;
    let row = Math.floor(totalRows * (rowPercent + 0.0005)); // add .0005 for rounding error in percent
    this.firstVisibleIndex = row * this.layoutDetails.Columns;
    this.drawItems(this.firstVisibleIndex, this.layoutDetails, this.layoutView);
  }

  scrollToRow(row) {
    this.firstVisibleIndex = row * this.layoutDetails.Columns;
    this.layoutScroll.scrollTo(0, row * this.layoutDetails.RowHeight);
    //this.drawItems(this.firstVisibleIndex, this.layoutDetails, this.layoutView);
  }

  onSelectionChanged(_list) {
    this.drawItems(this.firstVisibleIndex, this.layoutDetails, this.layoutView);
  }

  onListUpdated(_list) {
    this.onContainerResize();
  }

  onContainerResize() {
    this.layoutDetails = this.createLayoutDetails();

    let totalRows = this.list.Length / this.layoutDetails.Columns + 1;
    let totalHeight = totalRows * this.layoutDetails.RowHeight;
    //this.layoutScroll.style.height = px(totalHeight);
    this.setScrollHeight(totalHeight);
    let item = media.getFocus();
    if (item) {
      this.ensureVisible(item);
    }
    this.drawItems(this.firstVisibleIndex, this.layoutDetails, this.layoutView);
  }

  setScrollHeight(height) {
    let bottom = dom.first(this.layoutScroll, '.bottom');
    if (bottom == null) {
      bottom = dom.createElement('div', {
        class: 'bottom',
        style: 'position:absolute;width:1px;height:1px'
      });
      dom.append(this.layoutScroll, bottom);
    }
    bottom.style.top = px(height);
  }

  onZoomChange(newValue) {
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
    this.gridDataName = 'data-layout-grid-visible';
  }

  drawItems(firstItemIndex, layoutDetails, view) {
    if (firstItemIndex < 0) {
      firstItemIndex = 0;
    }
    let selection = Media.getSelectedItems();
    let visibleItems = Media.getVisibleItems();
    let visible = true;
    let left = 0;
    let top = view.scrollTop;
    let viewBottom = view.scrollTop + view.clientHeight;
    let width = layoutDetails.ItemWidth;
    let height = layoutDetails.ItemHeight;
    let gap = layoutDetails.Gap;
    let viewWidth = layoutDetails.ViewWidth;
    let viewHeight = layoutDetails.ViewHeight;
    if (viewWidth == 0 || viewHeight == 0) {
      return;
    }

    this.itemStepCount = layoutDetails.Columns;
    let itemIndex = firstItemIndex;
    let html = this.getItemHtml(itemIndex);
    let layoutChildren = [];
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
      let item = visibleItems.getItemAt(itemIndex);
      dom.toggleClass(html, 'selected', selection.contains(item));
      dom.toggleClass(html, 'group', item.isInGroup());
      dom.toggleClass(html, 'primary', item.isPrimary());

      dom.removeClass(html, [`rotate-90`, 'rotate-180', 'rotate-270']);
      if (item.RotationDegrees) {
        dom.addClass(html, `rotate-${(item.RotationDegrees + 360) % 360}`);
      }
      let img = dom.first(html, 'img');
      if (item.RotationDegrees == 90 || item.RotationDegrees == 270) {
        dom.addClass(img, 'portrait');
      } else {
        dom.addClass(img, 'landscape');
      }
      itemIndex += 1;
      html = this.getItemHtml(itemIndex);
    }

    let change = true;
    let children = view.children;
    if (layoutChildren.length == children.length) {
      change = false;
      for (let i = 0; i < layoutChildren.length && !change; i++) {
        if (layoutChildren[i] != children[i]) {
          change = true;
        }
      }
    }
    if (change) {
      let fragment = document.createDocumentFragment();
      for (let child of layoutChildren) {
        fragment.appendChild(child);
      }
      let bottom = dom.first(view, '.bottom');
      view.replaceChildren(fragment);
      dom.append(view, bottom);

      /*
       * position top margin after image has been inserted into the body DOM
       * before then the <img> has 0 size
       */
      for (let img of dom.find(view, 'img')) {
        if (!img.complete) {
          img.addEventListener('load', () => this.positionImage.bind(this));
        } else {
          this.positionImage(img);
        }
      }
    }
  }
  positionImage(img) {
    const height = this.layoutDetails.ItemHeight;
    let imgHeight = height;
    if (dom.hasClass(img, 'portrait')) {
      imgHeight = dom.getWidth(img);
    } else {
      imgHeight = dom.getHeight(img);
    }
    const margin = (height - imgHeight) / 2;
    img.style.top = px(margin);
  }
}
export default GridLayout;
