import { ComponentBase } from "../../drjs/browser/component.js";
import {
  BuildCheckboxHandler,
  BuildHoverHandler,
  BuildInputHandler,
  Listeners,
} from "../../drjs/browser/event.js";
import { BuildClickHandler } from "../../drjs/browser/event.js";
import {
  HtmlTemplate,
  PropertyValue,
  DataValue,
  AttributeValue,
} from "../../drjs/browser/html-template.js";
import { media, FilterChangeEvent } from "../modules/media.js";
import { Settings } from "../modules/settings.js";
import { LOG_LEVEL, Logger } from "../../drjs/logger.js";

const log = Logger.create("TagComponent", LOG_LEVEL.DEBUG);

function NameCompareFunction(a, b) {
  if (a == null) {
    return -1;
  }
  if (b == null) {
    return -1;
  }
  return a.getName().localeCompare(b.getName());
}

export class TagsComponent extends ComponentBase {
  constructor(selector, htmlName = "tags") {
    super(selector, htmlName);
    this.listeners = new Listeners();
    this.media = media;
    this.selectedTagIds = [];
  }

  async onHtmlInserted(elements) {
    this.template = new HtmlTemplate(this.dom.first("#tags-tag-template"));
    this.newTemplate = new HtmlTemplate(
      this.dom.first("#tags-new-tag-template")
    );

    this.tagTree = this.dom.first(".tag-tree");
    this.listeners.add(
      BuildClickHandler()
        .listenTo(this.tagTree, ".toggle")
        .onClick(this, this.toggleClosed)
        .setData((element) => {
          return this.dom.getDataWithParent(element, "id");
        })
        .build(),
      media.getTags().getUpdatedEvent().createListener(this, this.tagChange),

      BuildCheckboxHandler()
        .listenTo(this.tagTree, "input[type='checkbox']")
        .onChecked(this, this.onChecked)
        .onUnchecked(this, this.onUnchecked)
        .setData((element) => {
          return this.dom.getDataWithParent(element, "id");
        })
        .build()
    );
    this.tagChange();
  }

  onChecked(id, checkbox, event) {}
  onUnchecked(id, checkbox, event) {}

  toggleClosed(id, element) {
    log.debug("toggleClosed", id, element);
    this.dom.toggleClass(element.parentNode, "closed");
  }

  tagChange() {
    var top = media.getTags().getTopNodes();
    var tree = this.dom.first(".tag-tree");
    this.dom.removeChildren(tree);

    var children = tree;
    if (this.allowRoot()) {
      var root = this.createTagElement("/", "root");
      this.dom.addClass(root, "root");
      this.dom.append(tree, root);
      children = this.dom.first(root, ".children");
    }
    this.insertTags(children, top);
    if (this.allowUntagged()) {
      var untagged = this.createTagElement("Untagged", "untagged");
      this.dom.check(untagged);
      this.dom.addClass(untagged, "untagged");
      this.dom.append(tree, untagged);
    }
  }

  allowRoot() {
    return true;
  }
  allowUntagged() {
    return true;
  }

  insertTags(parentElement, nodes) {
    nodes.sort(NameCompareFunction);
    for (var tag of nodes) {
      var element = this.createTagElement(tag.getName(), tag);
      this.dom.append(parentElement, element);
    }
  }

  createTagElement(name, tag) {
    var id = tag;
    if (typeof tag == "object" && tag.getId()) {
      id = tag.getId();
    }
    var children = tag ? media.getTags().getChildren(tag) : [];
    var classList = "tag";
    if (children.length > 0) {
      classList += " has-children";
    }
    if (tag == null) {
      classList += " root";
    }

    var element = this.template.fill({
      ".name": name,
      ".tag": [new DataValue("id", id), new AttributeValue("class", classList)],
      ".add-child": new DataValue("parent-id", id),
      ".check": new PropertyValue("checked", this.isSelected(id)),
    });
    var settingName = this.getSettingName(id);
    if (settingName != null) {
      this.dom.addClass(element, "has-setting");
      this.dom.setData(element, "data-class-setting-name", settingName);
      this.dom.setData(element, "data-class-value", "closed");
    }
    this.insertTags(this.dom.first(element, ".children"), children);

    return element;
  }

  getSettingName(id) {
    return null;
  }

  isSelected(id) {
    return false;
  }
}

export class TagFilterComponent extends TagsComponent {
  constructor(selector, htmlName = "tags") {
    super(selector, htmlName);
    media.addFilter(this.filterItem.bind(this));
  }

  filterItem(item) {
    if (this.settings == null || this.settings.get("all")) {
      return true;
    }
    var itemTags = item.getTags();
    if (itemTags.length == 0) {
      return this.settings.get("untagged");
    }
    const found = itemTags.find((tag) => {
      return this.settings.get(tag.getId());
    });
    return found;
  }

  isSelected(id) {
    return this.settings.get("all") || this.settings.get(id) !== false;
  }
  selectionChanged(id) {
    FilterChangeEvent.emit();
  }
  onChange(id, isChecked, element) {
    log.debug("filter tag change ", id);
    this.settings.set(id, isChecked);
    if (!isChecked) {
      this.settings.set("all", false);
    }
  }

  getSettingName(id) {
    return `tag-filter-${id}`;
  }
  onChecked(id, checkbox, event) {
    this.tagChecked(id);
    this.selectionChanged(id);
    this.checkChildren(checkbox, true);
  }

  checkChildren(checkbox, isChecked) {
    var tag = this.dom.parent(checkbox, ".tag");
    var checks = this.dom.find(tag, '.children input[type="checkbox"]');
    this.dom.check(checks, isChecked);
  }
  onUnchecked(id, checkbox, event) {
    this.tagUnchecked(id);
    this.selectionChanged(id);
    this.checkChildren(checkbox, false);
    var parents = this.dom.parents(checkbox, ".tag");
    parents.forEach((tag) => {
      var check = this.dom.first(tag, 'input[type="checkbox"]');
      this.dom.uncheck(check);
    });
  }
  tagChecked(id) {
    log.debug("filter checked ", id);
    if (!this.selectedTagIds.includes(id)) {
      this.selectedTagIds.push(id);
      FilterChangeEvent.emit();
      var checkElement = this.dom.first(`.tag[data-id='${id}'] input.check`);
      this.dom.check(checkElement);
    }
  }

  tagUnchecked(id) {
    log.debug("filter unchecked ", id);
    if (this.selectedTagIds.includes(id)) {
      this.selectedTagIds.splice(this.selectedTagIds.indexOf(id), 1);
      FilterChangeEvent.emit();
    }
  }

  async onHtmlInserted(elements) {
    this.settings = await Settings.load("tag-filter", {
      all: true,
      untagged: true,
    });
    await super.onHtmlInserted(elements);

    this.listeners.add(
      BuildCheckboxHandler()
        .listenTo(this.tagTree, "input[type='checkbox']")
        .onChange(this, this.onChange)
        .setData((element) => {
          return this.dom.getDataWithParent(element, "id");
        })
        .build()
    );
  }
}

export class TagDetailsComponent extends TagsComponent {
  constructor(selector, htmlName = "tags") {
    super(selector, htmlName);
  }

  allowRoot() {
    return true;
  }
  allowUntagged() {
    return false;
  }
  async onHtmlInserted(elements) {
    await super.onHtmlInserted(elements);

    this.listeners.add(
      BuildInputHandler()
        .listenTo(this.tagTree, "input[name='name']")
        .onBlur(this, this.hideNameDialog)
        .onEnter(this, this.createTag)
        .onEscape(this, this.hideNameDialog)
        .build(),
      BuildClickHandler()
        .listenTo(this.tagTree, "button.ok")
        .onClick(this, this.createTag)
        .build(),
      BuildClickHandler()
        .listenTo(this.dom, ".add-child")
        .onClick(this, this.tagNameDialog)
        .build(),
      BuildHoverHandler()
        .listenTo(this.tagTree, ".tag")
        .onStart(this, this.hoverTag)
        .onEnd(this, this.unhoverTag)
        .build(),
      media
        .getSelectedItems()
        .getUpdatedEvent()
        .createListener(this, this.selectionChange)
    );
    this.dom.addClass(this.tagTree, "no-select");
  }

  hoverTag(element) {
    this.dom.addClass(element, "hover");
  }

  unhoverTag(element) {
    this.dom.removeClass(element, "hover");
  }

  selectionChange(selected) {
    log.debug("selected items change");
    const count = selected.getLength();
    this.dom.toggleClass(this.tagTree, "no-select", count == 0);
    this.dom.toggleClass(this.tagTree, "multi-select", count > 1);
  }

  addTag(parentId, val) {
    if (val != null && val.trim() != "") {
      if (parentId == "root") {
        parentId = null;
      }
      var tag = media.createTag(parentId, val);

      return true;
    } else {
      return false;
    }
  }
  createTag(target, event) {
    var input = this.dom.first(this.dom.parent(target, ".new"), "input");
    var val = this.dom.getValue(input);
    var parentId = this.dom.getData(target, "parent-id");
    if (val != null && val != "") {
      if (this.addTag(parentId, val)) {
        this.dom.setValue(input, "");
        // blur may happen at same time so don't hide twice
        setTimeout(() => {
          this.hideNameDialog();
        }, 10);
      }
    }
  }

  hideNameDialog() {
    if (this.newTagElement == null) {
      return;
    }
    this.dom.remove(this.newTagElement);
    this.newTagElement = null;
  }
  tagNameDialog(target, event) {
    this.hideNameDialog();
    var parentId = this.dom.getData(target.parentElement, "id");
    var dataValue = new DataValue("parent-id", parentId);
    this.newTagElement = this.newTemplate.fill({
      ".new": dataValue,
      parentId,
      input: dataValue,
      ".ok": dataValue,
    });
    var children = this.dom.firstSibling(target, ".children");
    this.dom.prepend(children, this.newTagElement);
    this.dom.setValue(this.dom.first(this.newTagElement, "input"), null);
    this.dom.setFocus(this.newTagElement, "input");
    log.debug("create tag");
  }

  onChecked(id, checkbox, event) {
    log.debug("add tag ", id);
    var parents = this.dom.parents(checkbox, ".tag");
    media.tagSelected(id);
    parents.forEach((tag) => {
      var check = this.dom.first(tag, 'input[type="checkbox"]');
      this.dom.check(check);
    });
  }
  onUnchecked(id, checkbox, event) {
    log.debug("remove tag ", id);
    media.untagSelected(id);
  }
}

export default TagsComponent;
