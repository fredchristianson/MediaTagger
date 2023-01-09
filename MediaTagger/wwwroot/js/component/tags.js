import { ComponentBase } from "../../drjs/browser/component.js";
import {
  BuildCheckboxHandler,
  BuildHoverHandler,
  BuildInputHandler,
  HandlerResponse,
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
    this.template = new HtmlTemplate(this.getTemplateElement());
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

      media
        .getTags()
        .getUpdatedEvent()
        .createListener(this, this.onTagListChange)
    );
    this.onTagListChange();
  }

  toggleClosed(id, element) {
    log.debug("toggleClosed", id, element);
    this.dom.toggleClass(element.parentNode, "closed");
  }

  onTagListChange() {
    var top = media.getTags().getTopNodes();
    var tree = this.dom.first(".tag-tree");
    this.dom.removeChildren(tree);

    if (this.allowUntagged()) {
      var untagged = this.createTagElement("Untagged", "untagged");
      this.dom.check(untagged);
      this.dom.addClass(untagged, "untagged");
      this.dom.append(tree, untagged);
    }

    var children = tree;
    if (this.allowRoot()) {
      var root = this.createTagElement("/", "root");
      this.dom.addClass(root, "root");
      this.dom.append(tree, root);
      children = this.dom.first(root, ".children");
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
    if (tag == "root" || children.length > 0) {
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

export class TagFilterComponent extends TagsComponent {
  constructor(selector, htmlName = "tags-filter") {
    super(selector, htmlName);
    media.addFilter(this.filterItem.bind(this));
    this.ignoreCheckboxChange = false;
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
        .onChange(this, this.onCheckboxChange)
        .setData((element) => {
          return this.dom.getDataWithParent(element, "id");
        })
        .build(),
      BuildClickHandler()
        .listenTo("#expand-all-filter-tags")
        .onClick(this, this.expandAll)
        .setDefaultResponse(HandlerResponse.StopAll)
        .build(),
      BuildClickHandler()
        .listenTo("#collapse-all-filter-tags")
        .onClick(this, this.collapseAll)
        .setDefaultResponse(HandlerResponse.StopAll)
        .build()
    );
  }

  getTemplateElement() {
    return this.dom.first("#tags-filter-template");
  }

  expandAll() {
    var parents = this.dom.find(".has-children");
    this.dom.removeClass(parents, "closed");
  }
  collapseAll() {
    var parents = this.dom.find(".has-children");
    this.dom.addClass(parents, "closed");
  }

  onCheckboxChange(id, checked, element) {
    log.debug("tag change ", checked, element);
    var state = this.dom.getData(element, "state");
    const tagElement = this.dom.parent(element, ".tag");
    var hasChildren = this.dom.hasClass(tagElement, "has-children");
    var childState = null;
    if (!hasChildren) {
      state = state != "checked" ? "checked" : "unchecked";
    } else {
      if (state == "unchecked") {
        state = "checked-and-children";
        childState = "checked";
      } else if (state == "checked-and-children") {
        state = "checked-no-children";
        childState = "unchecked";
      } else {
        state = "unchecked";
        childState = "unchecked";
      }
    }
    this.dom.setData(element, "state", state);
    if (childState) {
      const childrenContainer = this.dom.find(tagElement, ".children");
      const children = this.dom.find(
        childrenContainer,
        'input[type = "checkbox"]'
      );
      children.forEach((child) => {
        if (childState == "checked") {
          var moreChildren = this.dom.hasClass(
            this.dom.parent(child, ".tag"),
            "has-children"
          );
          this.dom.setData(
            child,
            "state",
            moreChildren ? "checked-and-children" : "checked"
          );
        } else {
          this.dom.setData(child, "state", "unchecked");
        }
      });
    }
    if (state == "unchecked") {
      var parent = this.dom.parent(tagElement, ".tag");
      while (parent != null) {
        var parentCheck = this.dom.first(parent, 'input[type="checkbox"]');
        if (this.dom.getData(parentCheck, "state") == "checked-and-children") {
          this.dom.setData(parentCheck, "state", "checked");
        }
        parent = this.dom.parent(parent, ".tag");
      }
    }
    this.updateSettings();
    this.checkChildOnly();
    FilterChangeEvent.emit();
  }

  checkChildOnly() {
    var childOnly = this.dom.find("input[data-state='child-only-check']");
    this.dom.setData(childOnly, "state", "unchecked");
    var unchecked = this.dom.find("input[data-state='unchecked']");
    unchecked.forEach((uncheck) => {
      var parent = this.dom.parent(uncheck, ".tag");
      var checkchild = this.dom.first(parent, 'input[data-state^="check"]');
      if (checkchild != null) {
        this.dom.setData(uncheck, "state", "child-only-check");
      }
    });
  }

  updateSettings() {
    var checks = this.dom.find("input.check");
    checks.forEach((check) => {
      var id = this.dom.getDataWithParent(check, "id");
      this.settings.set(`state-${id}`, this.dom.getData(check, "state"));
    });
    this.settings.set("all", false);
  }

  filterItem(item) {
    var keep = false;
    if (this.settings == null || this.settings.get("all")) {
      keep = true;
    } else {
      var itemTags = item.getTags();
      if (itemTags.length == 0) {
        keep = this.settings.get("state-untagged").startsWith("checked");
      } else {
        const found = itemTags.find((tag) => {
          var state = this.settings.get(`state-${tag.getId()}`);
          return state.startsWith("checked");
        });
        keep = found != null;
      }
    }
    return keep;
  }

  isSelected(id) {
    return this.settings.get("all") || this.settings.get(id) !== false;
  }

  /* override base methods */
  modifyTagElement(id, element) {
    const check = this.dom.first(element, "input[type='checkbox']");
    this.dom.setData(
      check,
      "state",
      this.settings.get(`state-${id}`, "unchecked")
    );
  }

  getSettingName(id) {
    return `tag-filter-${id}`;
  }
}

export class TagDetailsComponent extends TagsComponent {
  constructor(selector, htmlName = "tags-details") {
    super(selector, htmlName);
    this.ignoreCheckboxChange = false;
  }

  getTemplateElement() {
    return this.dom.first("#tags-details-template");
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
      BuildCheckboxHandler()
        .listenTo(this.tagTree, "input[type='checkbox']")
        .onChecked(this, this.onChecked)
        .onUnchecked(this, this.onUnchecked)
        .setData((element) => {
          return this.dom.getDataWithParent(element, "id");
        })
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
    this.ignoreCheckboxChange = true;
    log.debug("selected items change");
    const count = selected.getLength();
    this.dom.toggleClass(this.tagTree, "no-select", count == 0);
    this.dom.toggleClass(this.tagTree, "multi-select", count > 1);
    var selectedTags = {};
    for (var sel of selected) {
      for (var tag of sel.getTags()) {
        var st = selectedTags[tag.getId()];
        if (st == null) {
          st = { id: tag.getId(), count: 0 };
          selectedTags[tag.getId()] = st;
        }
        st.count += 1;
      }
    }
    var checks = this.dom.find("input.check");
    checks.forEach((check) => {
      var id = this.dom.getDataWithParent(check, "id");
      var st = selectedTags[id];
      var tagElement = this.dom.parent(check, ".tag");
      if (st == null) {
        this.dom.uncheck(check);
        this.dom.removeClass(tagElement, "partial");
      } else {
        this.dom.check(check);
        this.dom.toggleClass(tagElement, "partial", st.count < count);
      }
    });
    // don't hide unchecked tags. need to be visible to user
    // to check them.  may add a toggle to hide/unhide all
    // var tags = this.dom.find(".tag");
    // tags.forEach((tag) => {
    //   var hasCheck = this.dom.first(tag, ":checked");
    //   this.dom.show(tag, hasCheck);
    // });
    log.debug("change done");
    this.ignoreCheckboxChange = false;

    FilterChangeEvent.emit();
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
    if (this.ignoreCheckboxChange) {
      return;
    }
    log.debug("add tag ", id);
    var parents = this.dom.parents(checkbox, ".tag");
    media.tagSelected(id);
    parents.forEach((tag) => {
      var check = this.dom.first(tag, 'input[type="checkbox"]');
      this.dom.check(check);
    });
  }
  onUnchecked(id, checkbox, event) {
    if (this.ignoreCheckboxChange) {
      return;
    }
    log.debug("remove tag ", id);
    media.untagSelected(id);
  }
}

export default TagsComponent;
