import { LOG_LEVEL, Logger } from '../../drjs/logger.js';
import { dom } from '../../drjs/browser/dom.js';
import { ZoomEvent } from '../component/view-options.js';
import {
  Listeners,
  BuildScrollHandler,
  BuildCustomEventHandler
} from '../../drjs/browser/event.js';
import { media } from './media.js';
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
    this.layoutScroll = dom.first(this.container, '.view');
    this.layoutView = dom.first(this.container, '.view');
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
        .emitter(media.getSelectedItems().getUpdatedEvent())
        .onEvent(this, this.onSelectionChanged)
        .build(),

      BuildCustomEventHandler()
        .emitter(media.getFocusChangeEvent())
        .onEvent(this, this.setFocus)
        .build(),
      BuildCustomEventHandler()
        .emitter(media.getFocusEntityChangeEvent())
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
    const oldFocus = dom.first('.focus');
    dom.removeClass(oldFocus, 'focus');
    const focusItem = item;
    if (item != null) {
      this.ensureVisible(focusItem);
    }
    if (item != null && item._layoutElement) {
      dom.addClass(item._layoutElement, 'focus');

      const img = dom.first(item._layoutElement, 'img');
      img.src = null;
      fetch(item.getThumbnailUrl(), {
        cache: 'reload',
        mode: 'no-cors'
      }).then(() => {
        img.src = item.getThumbnailUrl();
      });
      /*
       * const element = this.htmlCreator(item);
       * item._layoutElement = element;
       */
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
    const index = this.list.indexOf(item);
    const itemCount = this.list.Length;
    const scrollHeight = this.layoutScroll.scrollHeight;
    const scrollTop = this.layoutScroll.scrollTop;
    const scrollPercent = scrollTop / scrollHeight;
    const totalRows = Math.floor(itemCount / this.layoutDetails.Columns) + 1;
    const itemRow = Math.floor(index / this.layoutDetails.Columns);
    let firstVisibleRow = Math.floor(scrollPercent * totalRows);
    const lastVisibleRow = firstVisibleRow + this.layoutDetails.VisibleRows - 1;

    if (itemRow < firstVisibleRow) {
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
    const item = this.list.getItemAt(index);
    return item;
  }

  getItemHtml(index) {
    const item = this.list.getItemAt(index);
    if (item == null) {
      return null;
    }
    if (item._layoutElement == null) {
      const element = this.htmlCreator(item);
      item._layoutElement = element;
    }
    return item._layoutElement;
  }

  onScroll(_target, _event) {
    const pos = this.layoutScroll.scrollTop;
    const totalRows =
      Math.floor(media.getVisibleItems().Length / this.layoutDetails.Columns) +
      1;

    const rowPercent = pos / this.layoutScroll.scrollHeight;
    // add .0005 for rounding error in percent
    const row = Math.floor(totalRows * (rowPercent + 0.0005));
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

    const totalRows = this.list.Length / this.layoutDetails.Columns + 1;
    const totalHeight =
      (totalRows + 1) * (this.layoutDetails.RowHeight + this.layoutDetails.Gap);
    //this.layoutScroll.style.height = px(totalHeight);
    this.setScrollHeight(totalHeight);
    const item = media.getFocus();
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

  // eslint-disable-next-line complexity
  drawItems(firstItemIndex, layoutDetails, view) {
    if (firstItemIndex < 0) {
      firstItemIndex = 0;
    }
    const selection = media.getSelectedItems();
    const visibleItems = media.getVisibleItems();
    let visible = true;
    let left = 0;
    let top = view.scrollTop;
    const viewBottom = view.scrollTop + view.clientHeight;
    const width = layoutDetails.ItemWidth;
    const height = layoutDetails.ItemHeight;
    const gap = layoutDetails.Gap;
    const viewWidth = layoutDetails.ViewWidth;
    const viewHeight = layoutDetails.ViewHeight;
    if (viewWidth == 0 || viewHeight == 0) {
      return;
    }

    this.itemStepCount = layoutDetails.Columns;
    let itemIndex = firstItemIndex;
    let html = this.getItemHtml(itemIndex);
    const layoutChildren = [];
    left = gap;
    top = view.scrollTop + gap;
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
      const item = visibleItems.getItemAt(itemIndex);
      dom.toggleClass(html, 'selected', selection.contains(item));
      dom.toggleClass(html, 'group', item.isInGroup());
      dom.toggleClass(html, 'primary', item.isPrimary());

      dom.removeClass(html, ['rotate-90', 'rotate-180', 'rotate-270']);
      if (item.RotationDegrees) {
        dom.addClass(html, `rotate-${(item.RotationDegrees + 360) % 360}`);
      }
      const img = dom.first(html, 'img');
      if (item.RotationDegrees == 90 || item.RotationDegrees == 270) {
        dom.addClass(img, 'portrait');
      } else {
        dom.addClass(img, 'landscape');
      }
      itemIndex += 1;
      html = this.getItemHtml(itemIndex);
    }

    let change = true;
    const children = view.children;
    if (layoutChildren.length == children.length) {
      change = false;
      for (let i = 0; i < layoutChildren.length && !change; i++) {
        if (layoutChildren[i] != children[i]) {
          change = true;
        }
      }
    }
    if (change) {
      const fragment = document.createDocumentFragment();
      for (const child of layoutChildren) {
        fragment.appendChild(child);
      }
      const bottom = dom.first(view, '.bottom');
      //view.replaceChildren(fragment);
      view.replaceChildren(...layoutChildren);
      dom.append(view, bottom);

      /*
       * position top margin after image has been inserted into the body DOM
       * before then the <img> has 0 size
       */
      for (const img of dom.find(view, 'img')) {
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
