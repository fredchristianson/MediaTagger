import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import { ComponentBase } from "../../drjs/browser/component.js";
import {
  BuildCheckboxHandler,
  BuildClickHandler,
  Listeners,
  HandlerResponse,
} from "../../drjs/browser/event.js";
import {
  HtmlTemplate,
  PropertyValue,
} from "../../drjs/browser/html-template.js";
import { FilterChangeEvent, media } from "../modules/media.js";

const log = Logger.create("PropertyFilter", LOG_LEVEL.DEBUG);

const fileSizeBuckets = [
  { size: 1000, label: "<1K" },
  { size: 10000, label: "<10K" },
  { size: 10000, label: "10K-100K" },
  { size: 100000, label: "100K-1M" },
  { size: 1000000, label: "1M-10M" },
  { size: 10000000, label: "10M-100M" },
  { size: 100000000, label: "100M-1G" },
  { size: null, label: ">1G" },
];

function labelCompare(a, b) {
  if (a == null) {
    return -1;
  }
  if (b == null) {
    return 1;
  }
  return a.getLabel().localeCompare(b.getLabel());
}

function resolutionCompare(a, b) {
  if (a == null || a.details == null || a.details.width == null) {
    return -1;
  }
  if (b == null || b.details == null || b.details.width == null) {
    return 1;
  }
  if (a.details.width == b.details.width) {
    return a.details.height - b.details.height;
  }
  return a.details.width - b.details.width;
}
class PropertyOption {
  constructor(label) {
    this.label = label;
    this.count = 0;
    this.details = null;
    this.selected = true;
    this.compareFunc = labelCompare;
    this.checkbox = null;
  }

  setSelected(sel) {
    this.selected = sel;
  }
  isSelected() {
    return this.selected;
  }
  setCheckbox(element) {
    this.checkbox = element;
  }

  setCompareFunction(func) {
    this.compareFunc = func;
  }
  compare(other) {
    return this.compareFunc(this, other);
  }
  setDetails(details) {
    this.details = details;
  }
  getDetails() {
    return this.details;
  }
  getLabel() {
    return this.label;
  }
  getCount() {
    return this.count;
  }
  increaseCount(ammount = 1) {
    this.count += ammount;
  }
}

export class PropertyFilterComponent extends ComponentBase {
  constructor(selector, htmlName = "property-filter") {
    super(selector, htmlName);
    this.listeners = new Listeners();
    this.sizes = [];
    this.resolutions = [];
    this.extensions = [];
  }

  async onHtmlInserted(elements) {
    this.extTemplate = new HtmlTemplate(
      this.dom.first("#properties--extension-template")
    );
    this.resolutionTemplate = new HtmlTemplate(
      this.dom.first("#properties--resolution-template")
    );
    this.filesizeTemplate = new HtmlTemplate(
      this.dom.first("#properties--size-template")
    );

    this.files = media.getAllFiles();
    this.listeners.add(
      this.files.getUpdatedEvent().createListener(this, this.onFilesChanged),
      BuildCheckboxHandler()
        .listenTo(this.dom, "input[type='checkbox']")
        .onChange(this, this.checkChange)
        .build(),
      BuildClickHandler()
        .listenTo(this.dom, "[href='#all']")
        .setDefaultResponse(HandlerResponse.StopAll)
        .onClick(this, this.checkAll)

        .build(),
      BuildClickHandler()
        .listenTo(this.dom, "[href='#none']")
        .onClick(this, this.checkNone)
        .setDefaultResponse(HandlerResponse.StopAll)
        .build()
    );
    this.onFilesChanged();
    media.addFilter(this.filterItem.bind(this));
  }

  checkAll(element) {
    var checkboxes = this.dom.find(
      this.dom.parent(element, ".list"),
      "[type='checkbox']"
    );
    checkboxes.forEach((cb) => {
      this.dom.check(cb);
    });
    this.updateOptions(this.sizes);
    this.updateOptions(this.resolutions);
    this.updateOptions(this.extensions);
    FilterChangeEvent.emit(this);
  }

  checkNone(element) {
    var checkboxes = this.dom.find(
      this.dom.parent(element, ".list"),
      "[type='checkbox']"
    );
    checkboxes.forEach((cb) => {
      this.dom.uncheck(cb);
    });
    this.updateOptions(this.sizes);
    this.updateOptions(this.resolutions);
    this.updateOptions(this.extensions);
    FilterChangeEvent.emit(this);
  }

  updateOptions(list) {
    for (var option of list) {
      if (option.checkbox) {
        option.setSelected(option.checkbox.checked);
      }
    }
  }

  checkChange(checked, element) {
    this.updateOptions(this.sizes);
    this.updateOptions(this.resolutions);
    this.updateOptions(this.extensions);
    FilterChangeEvent.emit(this);
  }

  isOptionSelected(label, list) {
    const match = list.find((opt) => {
      return opt.getLabel() == label;
    });
    if (match) {
      return match.isSelected();
    }
    // for (var opt of list) {
    //   if (opt.getLabel() == label) {
    //     return opt.isSelected();
    //   }
    // }
    log.error("unknown option ", label);
    return true;
  }

  filterItem(item) {
    if (!this.isOptionSelected(item.getResolution(), this.resolutions)) {
      return false;
    }
    if (
      !this.isOptionSelected(
        this.getFileSizeBucket(item.getFileSize()),
        this.sizes
      )
    ) {
      return false;
    }
    if (!this.isOptionSelected(item.getExtension(), this.extensions)) {
      return false;
    }
    return true;
  }

  async onDetach() {
    this.listeners.removeAll();
  }
  onFilesChanged() {
    this.sizes = [];
    this.resolutions = [];
    this.extensions = [];
    for (var file of this.files) {
      var ext = file.getExtension();
      var opt = this.getOption(this.extensions, ext);
      opt.increaseCount();

      var res = file.getResolution();
      opt = this.getOption(this.resolutions, res);
      opt.setDetails({ width: file.getWidth(), height: file.getHeight() });
      opt.setCompareFunction(resolutionCompare);
      opt.increaseCount();

      var size = this.getFileSizeBucket(file.getFileSize());
      opt = this.getOption(this.sizes, size);
      opt.increaseCount();
    }
    this.fill(
      this.dom.first(".extension.list"),
      this.extensions,
      this.extTemplate
    );
    this.fill(
      this.dom.first(".resolution.list"),
      this.resolutions,
      this.resolutionTemplate
    );
    this.fill(
      this.dom.first(".file-size.list"),
      this.sizes,
      this.filesizeTemplate
    );
  }

  fill(selector, list, template) {
    list.sort((a, b) => {
      return a.compare(b);
    });
    this.dom.removeChildren(selector);
    var allNone = this.dom.createElement("li", { "@class": "allnone" });
    this.dom.append(
      allNone,
      this.dom.createElement("a", { href: "#all", text: "all" })
    );
    this.dom.append(
      allNone,
      this.dom.createElement("a", { href: "#none", text: "none" })
    );
    this.dom.append(selector, allNone);
    for (var item of list) {
      var child = template.fill({
        ".label": item.getLabel(),
        "[type='checkbox']": new PropertyValue("checked", true),
      });
      item.setCheckbox(this.dom.first(child, "[type='checkbox']"));
      this.dom.append(selector, child);
    }
  }

  getOption(list, label) {
    var opt = list.find((o) => {
      return o.getLabel() == label;
    });
    if (opt == null) {
      opt = new PropertyOption(label);
      list.push(opt);
    }
    return opt;
  }
  getFileSizeBucket(size) {
    var bucket = 0;
    while (
      fileSizeBuckets[bucket + 1] != null &&
      fileSizeBuckets[bucket + 1].size < size
    ) {
      bucket++;
    }
    return fileSizeBuckets[bucket].label;
  }
}

export default PropertyFilterComponent;
