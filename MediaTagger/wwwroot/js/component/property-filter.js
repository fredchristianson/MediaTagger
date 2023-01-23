import { LOG_LEVEL, Logger } from '../../drjs/logger.js';
import { ComponentBase } from '../../drjs/browser/component.js';
import {
  BuildCheckboxHandler,
  BuildClickHandler,
  BuildCustomEventHandler,
  Listeners,
  Continuation
} from '../../drjs/browser/event.js';
import {
  HtmlTemplate,
  PropertyValue
} from '../../drjs/browser/html-template.js';
import { FilterChangeEvent, media } from '../modules/media.js';
import { Settings } from '../modules/settings.js';

const log = Logger.create('PropertyFilter', LOG_LEVEL.DEBUG);

const fileSizeBuckets = [
  { size: 1000, label: '<1K' },
  { size: 10000, label: '<10K' },
  { size: 10000, label: '10K-100K' },
  { size: 100000, label: '100K-1M' },
  { size: 1000000, label: '1M-10M' },
  { size: 10000000, label: '10M-100M' },
  { size: 100000000, label: '100M-1G' },
  { size: null, label: '>1G' }
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
  constructor(selector, htmlName = 'property-filter') {
    super(selector, htmlName);
    this.listeners = new Listeners();
    this.sizes = [];
    this.resolutions = [];
    this.extensions = [];
  }

  async onHtmlInserted(elements) {
    this.settings = await Settings.load('property-filter');

    this.extTemplate = new HtmlTemplate(
      this.dom.first('#properties--extension-template')
    );
    this.resolutionTemplate = new HtmlTemplate(
      this.dom.first('#properties--resolution-template')
    );
    this.filesizeTemplate = new HtmlTemplate(
      this.dom.first('#properties--size-template')
    );

    this.files = media.getAllFiles();
    this.listeners.add(
      BuildCustomEventHandler()
        .emitter(this.files.getUpdatedEvent())
        .onEvent(this, this.onFilesChanged)
        .build(),
      BuildCheckboxHandler()
        .listenTo(this.dom, "input[type='checkbox']")
        .onChange(this, this.checkChange)
        .build(),
      BuildClickHandler()
        .listenTo(this.dom, "[href='#all']")
        .setDefaultContinuation(Continuation.StopAll)
        .onClick(this, this.checkAll)

        .build(),
      BuildClickHandler()
        .listenTo(this.dom, "[href='#none']")
        .onClick(this, this.checkNone)
        .setDefaultContinuation(Continuation.StopAll)
        .build()
    );
    this.onFilesChanged();
    media.addFilter(this.filterItem.bind(this));
  }

  checkAll(element) {
    let checkboxes = this.dom.find(
      this.dom.closest(element, '.list'),
      "[type='checkbox']"
    );
    checkboxes.forEach((cb) => {
      //this.dom.check(cb);
      cb.checked = true;
    });
    this.updateOptions(this.sizes, '.file-size.count');
    this.updateOptions(this.resolutions, '.resolution.count');
    this.updateOptions(this.extensions, '.extension.count');
    FilterChangeEvent.emit(this);
  }

  checkNone(element) {
    let checkboxes = this.dom.find(
      this.dom.closest(element, '.list'),
      "[type='checkbox']"
    );
    checkboxes.forEach((cb) => {
      //this.dom.uncheck(cb);
      cb.checked = false;
    });
    this.updateOptions(this.sizes, '.file-size.count');
    this.updateOptions(this.resolutions, '.resolution.count');
    this.updateOptions(this.extensions, '.extension.count');
    FilterChangeEvent.emit(this);
  }

  updateOptions(list, countElement) {
    let selectCount = 0;
    for (let option of list) {
      if (option.checkbox) {
        option.setSelected(option.checkbox.checked);
        this.settings.set(option.getLabel(), option.checkbox.checked);
        if (option.checkbox.checked) {
          selectCount += 1;
        }
      }
    }
    if (countElement) {
      countElement = this.dom.first(countElement);
      if (selectCount == list.length) {
        countElement.innerHTML = '(all)';
      } else {
        countElement.innerHTML = `(${selectCount} of ${list.length})`;
      }
    }
  }

  checkChange(checked, element) {
    this.updateOptions(this.sizes, '.file-size.count');
    this.updateOptions(this.resolutions, '.resolution.count');
    this.updateOptions(this.extensions, '.extension.count');
    FilterChangeEvent.emit(this);
  }

  isOptionSelected(label, list) {
    const match = list.find((opt) => {
      return opt.getLabel() == label;
    });
    if (match) {
      return match.isSelected();
    }
    // for (let opt of list) {
    //   if (opt.getLabel() == label) {
    //     return opt.isSelected();
    //   }
    // }
    log.never('unknown option ', label);
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
    for (let file of this.files) {
      let ext = file.getExtension();
      let opt = this.getOption(this.extensions, ext);
      opt.increaseCount();

      let res = file.getResolution();
      opt = this.getOption(this.resolutions, res);
      opt.setDetails({ width: file.getWidth(), height: file.getHeight() });
      opt.setCompareFunction(resolutionCompare);
      opt.increaseCount();

      let size = this.getFileSizeBucket(file.getFileSize());
      opt = this.getOption(this.sizes, size);
      opt.increaseCount();
    }
    this.fill(
      this.dom.first('.extension.list'),
      this.extensions,
      this.extTemplate,
      this.dom.first('.extension.count')
    );
    this.fill(
      this.dom.first('.resolution.list'),
      this.resolutions,
      this.resolutionTemplate,
      this.dom.first('.resolution.count')
    );
    this.fill(
      this.dom.first('.file-size.list'),
      this.sizes,
      this.filesizeTemplate,
      this.dom.first('.file-size.count')
    );
    FilterChangeEvent.emit();
  }

  fill(selector, list, template, countElement) {
    list.sort((a, b) => {
      return a.compare(b);
    });
    this.dom.removeChildren(selector);
    let allNone = this.dom.createElement('li', { '@class': 'allnone' });
    this.dom.append(
      allNone,
      this.dom.createElement('a', { href: '#all', text: 'all' })
    );
    this.dom.append(
      allNone,
      this.dom.createElement('a', { href: '#none', text: 'none' })
    );
    this.dom.append(selector, allNone);
    let selectCount = 0;
    for (let item of list) {
      const checked = this.settings.get(item.getLabel());
      item.setSelected(checked);
      if (checked) {
        selectCount += 1;
      }
      let child = template.fill({
        '.label': item.getLabel(),
        "[type='checkbox']": new PropertyValue('checked', checked)
      });
      // this.dom.check(this.dom.first(child,, this.settings.get(item.getLabel()));
      item.setCheckbox(this.dom.first(child, "[type='checkbox']"));
      this.dom.append(selector, child);
    }
    if (countElement) {
      if (selectCount == list.length) {
        countElement.innerHTML = '(all)';
      } else {
        countElement.innerHTML = `(${selectCount} of ${list.length})`;
      }
    }
  }

  getOption(list, label) {
    let opt = list.find((o) => {
      return o.getLabel() == label;
    });
    if (opt == null) {
      opt = new PropertyOption(label);
      list.push(opt);
    }
    return opt;
  }
  getFileSizeBucket(size) {
    let bucket = 0;
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
