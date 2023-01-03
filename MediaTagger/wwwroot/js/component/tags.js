import { ComponentBase } from "../../drjs/browser/component.js";
import { BuildHoverHandler, Listeners } from "../../drjs/browser/event.js";
import { BuildClickHandler } from "../../drjs/browser/event.js";
import media from "../modules/media.js";

export class TagsComponent extends ComponentBase {
  constructor(selector, htmlName = "tags") {
    super(selector, htmlName);
    this.listeners = new Listeners();
    this.media = media;
  }

  async onHtmlInserted(elements) {
    this.listeners.add(
      BuildClickHandler()
        .listenTo(this.dom, ".add")
        .onClick(this, this.addTag)
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
        .build()
    );
    this.tagChange();
  }

  toggleClosed(element) {
    this.dom.toggleClass(element.parentNode, "closed");
  }
  hoverTag(element) {
    //this.dom.addClass(element, "hover");
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
    //this.dom.removeClass(element, "hover");
  }

  tagChange() {
    var top = media.getTags().getTopNodes();
    var tree = this.dom.first(".tree");
    this.dom.removeChildren(tree);
    var root = this.createTagElement("/", null);
    this.dom.addClass(root, "root");
    this.dom.append(tree, root);
    this.insertTags(tree, top);
  }

  insertTags(parentElement, nodes) {
    for (var tag of nodes) {
      var element = this.createTagElement(tag.getName(), tag);
      this.dom.append(parentElement, element);
    }
  }

  createTagElement(name, tag) {
    var children = tag ? media.getTags().getChildren(tag) : [];
    var classList = "tag";
    if (children.length > 0) {
      classList += " has-children";
    }
    var element = this.dom.createElement("div", {
      "@class": classList,
      "@data-id": tag ? tag.id : "root",
    });
    var nameElement = this.dom.createElement("span", name);
    this.dom.append(element, nameElement);

    if (tag) {
      var toggle = this.dom.createElement("div", { "@class": "toggle" });
      this.dom.append(element, toggle);
      var check = this.dom.createElement("input", {
        "@class": "check",
        "@type": "checkbox",
      });
      element.append(check);
      this.insertTags(element, children);
    }
    return element;
  }

  //   tagChange() {
  //     var all = media.getTags();
  //     var tree = this.dom.first(".tree");
  //     this.dom.removeChildren(tree);
  //     for (var tag of all) {
  //       var element = this.dom.createElement("div", tag.getName());
  //       this.dom.append(tree, element);
  //     }
  //   }

  addTag(event) {
    var val = this.dom.getValue("[name='tag']");
    media.createTag(null, val);
  }
}

export default TagsComponent;
