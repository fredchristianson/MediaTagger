import { ComponentBase } from '../../drjs/browser/component.js';
import {
  BuildCheckboxHandler,
  BuildCustomEventHandler,
  BuildHoverHandler,
  BuildInputHandler,
  Continuation,
  Listeners
} from '../../drjs/browser/event.js';
import { BuildClickHandler } from '../../drjs/browser/event.js';
import {
  HtmlTemplate,
  PropertyValue,
  DataValue,
  AttributeValue
} from '../../drjs/browser/html-template.js';
import { media, FilterChangeEvent } from '../modules/media.js';
import { Settings } from '../modules/settings.js';
import { LOG_LEVEL, Logger } from '../../drjs/logger.js';

const log = Logger.create('TagComponent', LOG_LEVEL.DEBUG);

function NameCompareFunction(a, b) {
  if (a == null) {
    return -1;
  }
  if (b == null) {
    return -1;
  }
  return a.getName().localeCompare(b.getName());
}

export class TagComponent extends ComponentBase {
  constructor(selector, htmlName) {
    super(selector, htmlName);
    this.listeners = new Listeners();
    this.media = media;
    this.selectedTagIds = [];
  }

  async onHtmlInserted(elements) {
    this.template = new HtmlTemplate(this.getTemplateElement());
    this.newTemplate = new HtmlTemplate(
      this.dom.first('#tags-new-tag-template')
    );

    this.tagTree = this.dom.first('.tag-tree');
    this.listeners.add(
      BuildClickHandler()
        .listenTo(this.tagTree, '.toggle')
        .onClick(this, this.toggleClosed)
        .setData((element) => {
          return this.dom.getDataWithParent(element, 'id');
        })
        .build(),
      BuildCustomEventHandler()
        .emitter(media.getTags().getUpdatedEvent())
        .onEvent(this, this.onTagListChange)
        .build()
    );
    this.onTagListChange();
  }

  toggleClosed(id, element) {
    log.debug('toggleClosed', id, element);
    this.dom.toggleClass(element.parentNode, 'closed');
  }

  onTagListChange() {
    let top = media.getTags().getTopNodes();
    let tree = this.dom.first('.tag-tree');
    this.dom.removeChildren(tree);

    if (this.allowUntagged()) {
      let untagged = this.createTagElement('Untagged', 'untagged');
      this.dom.check(untagged);
      this.dom.addClass(untagged, 'untagged');
      this.dom.append(tree, untagged);
    }

    let children = tree;
    if (this.allowRoot()) {
      let root = this.createTagElement('/', 'root');
      this.dom.addClass(root, 'root');
      this.dom.append(tree, root);
      children = this.dom.first(root, '.children');
    }
    this.insertTags(children, top);
  }

  allowRoot() {
    return true;
  }
  allowUntagged() {
    return true;
  }

  insertTags(parentElement, nodes) {
    nodes.sort(NameCompareFunction);
    for (let tag of nodes) {
      let element = this.createTagElement(tag.getName(), tag);
      this.dom.append(parentElement, element);
    }
  }

  createTagElement(name, tag) {
    let id = tag;
    if (typeof tag == 'object' && tag.getId()) {
      id = tag.getId();
    }
    let children = tag ? media.getTags().getChildren(tag) : [];
    let classList = 'tag';
    if (tag == 'root' || children.length > 0) {
      classList += ' has-children';
    }
    if (tag == null) {
      classList += ' root';
    }

    let element = this.template.fill({
      '.name': name,
      '.tag': [new DataValue('id', id), new AttributeValue('class', classList)],
      '.add-child': new DataValue('parent-id', id),
      '.check': new PropertyValue('checked', this.isSelected(id))
    });
    let settingName = this.getSettingName(id);
    if (settingName != null) {
      this.dom.addClass(element, 'has-setting');
      this.dom.setData(element, 'data-class-setting-name', settingName);
      this.dom.setData(element, 'data-class-value', 'closed');
    }
    this.insertTags(this.dom.first(element, '.children'), children);
    this.modifyTagElement(id, element);
    return element;
  }

  modifyTagElement(element) {
    /* derived classed can modify */
  }
  getSettingName(id) {
    return null;
  }

  isSelected(id) {
    return false;
  }
}

export default TagComponent;
