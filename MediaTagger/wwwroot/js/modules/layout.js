import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import dom from "../../drjs/browser/dom.js";
import { ZoomChangeEvent } from "../component/view-options.js";
import {
  Listeners,
  EventListener,
  ObjectListener,
  EventEmitter,
  BuildScrollHandler,
} from "../../drjs/browser/event.js";

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
  return `${num}px`;
}

export class Layout {
  constructor(containerSelector, list, htmlCreator) {
    this.containerSelector = containerSelector;
    this.htmlCreator = htmlCreator;
    this.list = list;
    this.container = dom.first(this.containerSelector);
    if (this.container == null) {
      throw new Error("Selector ", containerSelector, " not found");
    }
    this.containerWidth = this.container.offsetWidth;
    this.containerHeight = this.container.offsetHeight;

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
      new EventListener(ZoomChangeEvent, this, this.onZoomChange)
    );
    this.items = [];
    this.list.getUpdatedEvent().createListener(this, this.onListUpdated);
    this.listeners = new Listeners(
      BuildScrollHandler().listenTo(this.container).onScroll(this).build()
    );
  }

  onScroll(pos) {
    if (pos > this.container.scrollHeight - this.container.offsetHeight * 2) {
      this.addElements(500);
    }
  }
  onListUpdated(list) {
    this.addElements(500);
  }

  addElements(maxAdded) {
    var items = this.list.getItems();
    var count = 0;
    for (var i = 0; i < items.length && count < maxAdded; i++) {
      var item = items[i];
      if (item.__layout_element == null) {
        var element = this.htmlCreator(item);
        item.__layout_element = element;
        this.addItem(element);
        count++;
      }
    }
    // if (i < items.length) {
    //   setTimeout(() => {
    //     this.addElements(500);
    //   }, 100);
    // }
  }

  onContainerResize(containerWidth, containerHeight, entries) {
    /* base layout does nothing;*/
  }

  onZoomChange(newValue) {
    log.debug("layout zoom change ", newValue);
  }

  px(num) {
    return `${num}px`;
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
    this.nextLeft = this.gap;
    this.nextTop = this.gap;
    this.grid = dom.createElement("div");
    this.zoom = 100.0;
    this.setGridAttributes();
    dom.append(this.container, this.grid);
  }

  onZoomChange(newValue) {
    this.zoom = newValue;
    this.setGridAttributes();
  }

  onContainerResize(containerWidth, containerHeight, entries) {
    this.setGridAttributes();
  }

  setGridAttributes() {
    var style = this.grid.style;
    style.display = "none";
    style.width = "100%"; // this.px(this.container.clientWidth);
    //style.height = this.px(this.container.clientHeight);
    var zoomWidth = (this.itemWidth * this.zoom) / 100.0;
    this.columnCount = Math.floor(
      (this.containerWidth - zoomWidth) / (this.gap + zoomWidth + 1)
    );
    this.columnPercent = 100.0 / this.columnCount;
    this.gapPercent = this.gap / 100.0 + 1;
    style["column-gap"] = px(this.gap);
    style["row-gap"] = px(this.gap);
    style["grid-template-columns"] = `repeat(${this.columnCount},1fr)`;
    style["grid-auto-rows"] = "minmax(content,px(zoomWidth)";
    style["background-color"] = "hsl(180,100,50)";

    dom.toggleClass(this.grid, "detailed", zoomWidth > 200);
    dom.toggleClass(this.grid, "minimal", zoomWidth < 100);
    style.display = "grid";
  }

  insertElement(element) {
    this.grid.appendChild(element);
    element.style.display = "inline-block";
    element.position = null;
  }

  insertElementOld(element) {
    element.style.left = this.px(this.nextLeft);
    element.style.top = this.px(this.nextTop);
    element.style.width = this.px(this.itemWidth);
    element.style.height = this.px(this.itemHeight);
    element.style.display = "block";
    element.style.position = "absolute";

    this.nextLeft += this.itemWidth + this.gap;
    if (this.nextLeft + this.itemWidth + this.gap > this.containerWidth) {
      this.nextLeft = this.gap;
      this.nextTop += this.itemHeight + this.gap;
    }
    //dom.append(this.container, element);
    var e = this.container.appendChild(element);
  }
}

export default GridLayout;
