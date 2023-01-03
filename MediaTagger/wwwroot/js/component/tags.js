import { ComponentBase } from "../../drjs/browser/component.js";
import {
  BuildHoverHandler,
  BuildInputHandler,
  Listeners,
} from "../../drjs/browser/event.js";
import { BuildClickHandler } from "../../drjs/browser/event.js";
import {
  HtmlTemplate,
  ReplaceTemplateValue,
  DataValue,
  AttributeValue,
} from "../../drjs/browser/html-template.js";
import media from "../modules/media.js";
import { LOG_LEVEL, Logger } from "../../drjs/logger.js";

const log = Logger.create("TagComponent", LOG_LEVEL.DEBUG);

export class TagsComponent extends ComponentBase {
  constructor(selector, htmlName = "tags") {
    super(selector, htmlName);
    this.listeners = new Listeners();
    this.media = media;
  }

  async onHtmlInserted(elements) {
    this.template = new HtmlTemplate(this.dom.first("#tags-tag-template"));
    this.newTemplate = new HtmlTemplate(
      this.dom.first("#tags-new-tag-template")
    );

    this.listeners.add(
      BuildClickHandler()
        .listenTo(this.dom, ".add-child")
        .onClick(this, this.tagNameDialog)
        .build(),
      BuildClickHandler()
        .listenTo(".tree", ".toggle")
        .onClick(this, this.toggleClosed)
        .build(),
      media.getTags().getUpdatedEvent().createListener(this, this.tagChange),
      BuildHoverHandler()
        .listenTo(".tree", ".tag")
        .onStart(this, this.hoverTag)
        .onEnd(this, this.unhoverTag)
        .build(),
      BuildInputHandler()
        .listenTo(".tree", "input[name='name']")
        .onBlur(this, this.hideNameDialog)
        .onEnter(this, this.createTag)
        .onEscape(this, this.hideNameDialog)
        .build(),
      BuildClickHandler()
        .listenTo(".tree", "button.ok")
        .onClick(this, this.createTag)
        .build()
    );
    this.tagChange();
  }

  toggleClosed(element) {
    this.dom.toggleClass(element.parentNode, "closed");
  }
  hoverTag(element) {
    this.dom.addClass(element, "hover");
    var id = this.dom.getData(element, "id");
    this.dom.setFocus("input[name='tag']");
    if (id == "root") {
      this.dom.setInnerHTML(".new-tag .parent", "/");
      return;
    }
    var tag = media.getTags().findById(id);
    if (tag) {
      this.dom.setInnerHTML(".new-tag .parent", media.getTagPath(tag));
    }
  }

  unhoverTag(element) {
    this.dom.removeClass(element, "hover");
  }

  tagChange() {
    var top = media.getTags().getTopNodes();
    var tree = this.dom.first(".tree");
    this.dom.removeChildren(tree);
    var root = this.createTagElement("/", null);
    this.dom.addClass(root, "root");
    this.dom.append(tree, root);
    this.insertTags(this.dom.first(root, ".children"), top);
  }

  insertTags(parentElement, nodes) {
    for (var tag of nodes) {
      var element = this.createTagElement(tag.getName(), tag);
      this.dom.append(parentElement, element);
    }
  }

  createTagElement(name, tag) {
    var id = tag == null ? "root" : tag.getId();

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
    });
    this.insertTags(this.dom.first(element, ".children"), children);

    // if (tag) {
    //   var toggle = this.dom.createElement("div", { "@class": "toggle" });
    //   this.dom.append(element, toggle);
    //   var check = this.dom.createElement("input", {
    //     "@class": "check",
    //     "@type": "checkbox",
    //   });
    //   element.append(check);
    //   this.insertTags(element, children);
    // }
    return element;
  }

  addTag(parentId, val) {
    if (val != null && val.trim() != "") {
      media.createTag(parentId, val);
      return true;
    } else {
      return false;
    }
  }
  createTag(target, event) {
    var input = this.dom.firstSibling(target, "input");
    if (
      this.addTag(
        this.dom.getData(target, "parent-id"),
        this.dom.getValue(input)
      )
    ) {
      // blur may happen at same time so don't hide twice
      setTimeout(() => {
        this.hideNameDialog();
      }, 10);
    }
  }

  hideNameDialog() {
    if (this.newTagElement == null) { return; }
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
}

export default TagsComponent;
