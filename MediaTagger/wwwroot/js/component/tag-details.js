import { ComponentBase } from "../../drjs/browser/component.js";
import {
  BuildCheckboxHandler,
  BuildCustomEventHandler,
  BuildHoverHandler,
  BuildInputHandler,
  Continuation,
  Listeners,
} from "../../drjs/browser/event.js";
import { BuildClickHandler } from "../../drjs/browser/event.js";
import {
  HtmlTemplate,
  PropertyValue,
  DataValue,
  AttributeValue,
} from "../../drjs/browser/html-template.js";
import {
  media,
  FilterChangeEvent,
  FocusChangeEvent,
} from "../modules/media.js";
import { Settings } from "../modules/settings.js";
import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import { TagComponent } from "./tags.js";
const log = Logger.create("TagComponent", LOG_LEVEL.DEBUG);

export class TagDetailsComponent extends TagComponent {
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
        .onFocusOut(this, this.hideNameDialog)
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
      BuildCustomEventHandler()
        .emitter(media.getSelectedItems().getUpdatedEvent())
        .onEvent(this, this.selectionChange)
        .build(),
      BuildCustomEventHandler()
        .emitter(FocusChangeEvent)
        .onEvent(this, this.selectionChange)
        .build()
    );
    this.dom.addClass(this.tagTree, "no-select");
  }

  hoverTag(element) {
    this.dom.addClass(element, "hover");
  }

  unhoverTag(element) {
    this.dom.removeClass(element, "hover");
  }

  selectionChange() {
    const selected = media.getSelectedItems();
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
      var tagElement = this.dom.closest(check, ".tag");
      if (st == null) {
        this.dom.uncheck(check);
        this.dom.removeClass(tagElement, "partial");
      } else {
        this.dom.check(check);
        this.dom.toggleClass(tagElement, "partial", st.count < count);
      }
    });
    var tags = this.dom.find(".tag");
    tags.forEach((tag) => {
      var hasCheck = this.dom.first(tag, ":checked");
      this.dom.show(tag, hasCheck);
    });
    log.debug("change done");
    this.ignoreCheckboxChange = false;

    //FilterChangeEvent.emit();
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
    var input = this.dom.first(this.dom.closest(target, ".new"), "input");
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
    var parents = this.dom.ancestors(checkbox, ".tag");
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
