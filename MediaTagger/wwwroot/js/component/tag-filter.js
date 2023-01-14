import {
  BuildCheckboxHandler,
  EventHandlerReturn,
} from "../../drjs/browser/event.js";
import { Dialog } from "../controls/dialog.js";
import { BuildClickHandler } from "../../drjs/browser/event.js";
import { HtmlTemplate, InputValue } from "../../drjs/browser/html-template.js";
import { TagComponent } from "./tags.js";

import { media, FilterChangeEvent } from "../modules/media.js";
import { Settings } from "../modules/settings.js";
import { LOG_LEVEL, Logger } from "../../drjs/logger.js";

const log = Logger.create("TagComponent", LOG_LEVEL.DEBUG);

export class TagFilterComponent extends TagComponent {
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
    this.newTagTemplate = new HtmlTemplate(this.dom.first(".new-album-dialog"));

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
        .setDefaultResponse(EventHandlerReturn.StopAll)
        .build(),
      BuildClickHandler()
        .listenTo("#collapse-all-filter-tags")
        .onClick(this, this.collapseAll)
        .setDefaultResponse(EventHandlerReturn.StopAll)
        .build(),
      BuildClickHandler()
        .listenTo(this.dom, ".add-child")
        .capture()
        .onClick(this, this.addTag)
        .setDefaultResponse(EventHandlerReturn.StopAll)
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
    const tagElement = this.dom.closest(element, ".tag");
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
            this.dom.closest(child, ".tag"),
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
      var parent = this.dom.closest(tagElement, ".tag");
      while (parent != null) {
        var parentCheck = this.dom.first(parent, 'input[type="checkbox"]');
        if (this.dom.getData(parentCheck, "state") == "checked-and-children") {
          this.dom.setData(parentCheck, "state", "checked");
        }
        parent = this.dom.closest(parent, ".tag");
      }
    }
    var labels = this.dom.find("label.check-state");
    labels.forEach((label) => {
      const check = this.dom.first(label, "input");
      this.dom.setData(label, "state", this.dom.getData(check, "state"));
    });
    this.updateSettings();
    this.checkChildOnly();
    FilterChangeEvent.emit();
  }

  checkChildOnly() {
    var childOnly = this.dom.find("input[data-state='child-only-check']");
    this.dom.setData(childOnly, "state", "unchecked");
    var unchecked = this.dom.find("input[data-state='unchecked']");
    unchecked.forEach((uncheck) => {
      var parent = this.dom.closest(uncheck, ".tag");
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
        var untagged = this.settings.get("state-untagged");
        keep = untagged == null || untagged.startsWith("checked");
      } else {
        const found = itemTags.find((tag) => {
          var state = this.settings.get(`state-${tag.getId()}`);
          return state != null && state.startsWith("checked");
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
    this.dom.setData(
      check.parentNode,
      "state",
      this.dom.getData(check, "state")
    );
  }

  getSettingName(id) {
    return `tag-filter-${id}`;
  }

  addTag(parent) {
    const parentId = parent.dataset.parentId;
    const parentTag = getTagPath(parentId);
    const html = this.newTagTemplate.fill({
      ".parent": parentTag,
      "[name='parentId']": new InputValue("value", parentId),
    });
    var dialog = new Dialog(html, createTag);
    dialog.show();
  }
}

function getTagPath(id) {
  if (id == null || id == "root") {
    return "/";
  }
  const tag = media.getTagById(id);
  if (tag == null) {
    return "?";
  }
  return getTagPath(tag.getParentId()) + tag.Name + "/";
}
async function createTag(values) {
  log.debug("createTag", values);
  const parentId = values.parentId == "root" ? null : values.parentId;
  const tag = await media.createTag(parentId, values.name);
  return tag != null;
}
