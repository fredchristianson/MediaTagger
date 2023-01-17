import {
  BuildCheckboxHandler,
  Continuation,
} from "../../drjs/browser/event.js";
import { Dialog } from "../controls/dialog.js";
import { BuildClickHandler } from "../../drjs/browser/event.js";
import { HtmlTemplate, InputValue } from "../../drjs/browser/html-template.js";
import { TagComponent } from "./tags.js";

import { media, FilterChangeEvent } from "../modules/media.js";
import { Settings } from "../modules/settings.js";
import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import { dom as rootDom } from "../../drjs/browser/dom.js";

const log = Logger.create("TagComponent", LOG_LEVEL.DEBUG);

export class TagFilterComponent extends TagComponent {
  constructor(selector, htmlName = "tags-filter") {
    super(selector, htmlName);
    media.addFilter(this.filterItem.bind(this));
    this.ignoreCheckboxChange = false;
    this.isAny = true;
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
        .listenTo(".filter-op")
        .onClick(this, this.toggleFilterOp)
        .setDefaultContinuation(Continuation.StopAll)
        .build(),

      BuildClickHandler()
        .listenTo("#expand-all-filter-tags")
        .onClick(this, this.expandAll)
        .setDefaultContinuation(Continuation.StopAll)
        .build(),
      BuildClickHandler()
        .listenTo("#collapse-all-filter-tags")
        .onClick(this, this.collapseAll)
        .setDefaultContinuation(Continuation.StopAll)
        .build(),
      BuildClickHandler()
        .listenTo(this.dom, ".add-child")
        .capture()
        .onClick(this, this.addTag)
        .setDefaultContinuation(Continuation.StopAll)
        .build()
    );
    this.isAny = this.settings.get("filter-op-isAny");
    this.setFilterOp(this.isAny);
  }

  toggleFilterOp(target) {
    const isAny = this.dom.hasClass(target, "any");
    this.setFilterOp(!isAny);
  }
  setFilterOp(isAny) {
    this.isAny = isAny;
    const target = rootDom.first("button.filter-op");
    this.dom.toggleClass(target, "any", this.isAny);
    this.dom.toggleClass(target, "all", !this.isAny);
    this.settings.set("filter-op-isAny", this.isAny);
    FilterChangeEvent.emit();
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
    const tagElement = this.dom.closest(element, ".tag");
    const label = this.dom.first(tagElement, "label.check-state");
    var state = this.dom.getData(label, "state");
    var hasChildren = this.dom.hasClass(tagElement, "has-children");
    var childState = null;
    if (!hasChildren) {
      state = state != "checked" ? "checked" : "unchecked";
      this.dom.setData(label, "state", state);
    } else {
      if (state == "unchecked") {
        state = "checked-and-children";
        this.dom.setData(label, "state", state);
        this.updateChildren(tagElement, "checked");
      } else if (state == "checked-and-children") {
        state = "checked-no-children";
        this.dom.setData(label, "state", state);
        this.updateChildren(tagElement, "unchecked");
      } else {
        state = "unchecked";
        this.dom.setData(label, "state", state);
        this.updateChildren(tagElement, "unchecked");
      }
    }
    this.updateParent(tagElement);
    media.clearFocus();
    media.clearSelection();
    this.updateSettings();
    FilterChangeEvent.emit();
  }

  updateChildren(parent, state) {
    var children = this.dom.first(parent, ".children");
    var childStates = this.dom.find(children, ".check-state");
    childStates.forEach((child) => {
      this.dom.setData(child, "state", state);
    });
  }

  updateParent(tag) {
    var parent = this.dom.closest(tag, ".tag");
    while (parent != null) {
      const children = this.dom.find(parent, ".children");
      const checkState = this.dom.find(children, "label.check-state");
      const childChecked = checkState.find((child) => {
        const state = this.dom.getData(child, "state");
        return state != "unchecked";
      });
      //const checked = this.dom.getData(parent, "state") != "unchecked";
      var parentState = this.dom.getData(
        this.dom.first(parent, "label label"),
        "state"
      );
      const checked = parentState.startsWith("checked");
      var newState = "unchecked";
      if (checked && !childChecked) {
        newState = "checked-no-children";
      } else if (checked && childChecked) {
        newState = "checked-and-children";
      } else if (!checked && childChecked) {
        newState = "child-only-check";
      }
      const label = this.dom.first(parent, "label.check-state");
      this.dom.setData(label, "state", newState);
      parent = this.dom.closest(parent, ".tag");
    }
  }
  checkChildOnly() {
    var childOnly = this.dom.find("input[data-state='child-only-check']");
    this.dom.setData(childOnly, "state", "unchecked");
    var unchecked = this.dom.find("input[data-state='unchecked']");
    unchecked.forEach((uncheck) => {
      var parent = this.dom.closest(uncheck, ".tag");
      var checkchild = this.dom.first(parent, 'input[data-state^="check"]');
      if (checkchild != null) {
        var hasChildCheck = this.dom.first(
          parent,
          "input[data-state='checked']"
        );
        this.dom.setData(
          uncheck,
          "state",
          hasChildCheck ? "child-only-check" : "unchecked"
        );
      }
    });
  }

  updateSettings() {
    var checks = this.dom.find("label.check-state");
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
        if (this.isAny) {
          const found = itemTags.find((tag) => {
            var state = this.settings.get(`state-${tag.getId()}`);
            return state != null && state.startsWith("checked");
          });
          keep = found != null;
        } else {
          const selected = this.dom.find(
            'label.check-state[data-state^="check"]'
          );
          const selectedIds = selected
            .map((label) => {
              return this.dom.getDataWithParent(label, "id");
            })
            .filter((sel) => {
              return sel != "root";
            });

          // if nothing is selected, every() returns true but it's not a match
          const every =
            selectedIds.length > 0 &&
            selectedIds.every((selId) => {
              return itemTags.find((t) => {
                return t.Id == selId;
              });
            });
          keep = every;
        }
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
      "[name='parentId']": new InputValue(parentId),
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
