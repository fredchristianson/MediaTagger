import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import dom from "../../drjs/browser/dom.js";

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
  constructor(containerSelector) {
    this.containerSelector = containerSelector;
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
    this.items = [];
  }

  onContainerResize(containerWidth, containerHeight, entries) {
    /* base layout does nothing;*/
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
  constructor(containerSelector) {
    super(containerSelector);
    this.itemWidth = 128;
    this.itemHeight = 128;
    this.gap = 16;
    this.nextLeft = this.gap;
    this.nextTop = this.gap;
    this.grid = dom.createElement("div");
    this.setGridAttributes();
    dom.append(this.container, this.grid);
  }

  onContainerResize(containerWidth, containerHeight, entries) {
    this.setGridAttributes();
  }

  setGridAttributes() {
    var style = this.grid.style;
    style.display = "none";
    style.width = "100%"; // this.px(this.container.clientWidth);
    //style.height = this.px(this.container.clientHeight);
    this.columnCount = Math.floor(
      (this.containerWidth - this.itemWidth) / (this.gap + this.itemWidth + 1)
    );
    this.columnPercent = 100.0 / this.columnCount;
    this.gapPercent = this.gap / 100.0 + 1;
    style["column-gap"] = px(this.gap);
    style["row-gap"] = px(this.gap);
    style["grid-template-columns"] = `repeat(${this.columnCount},1fr)`;
    style["grid-auto-rows"] = px(this.itemHeight);
    style["background-color"] = "hsl(180,100,50)";

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
