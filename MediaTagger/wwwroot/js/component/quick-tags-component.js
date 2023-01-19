import { ComponentBase } from "../../drjs/browser/component.js";
import { Settings } from "../modules/settings.js";
import { Tree, TreeDataProvider, TreeItem } from "../controls/tree.js";
import { FocusChangeEvent, media } from "../modules/media.js";
import {
  Listeners,
  BuildInputHandler,
  BuildClickHandler,
  Continuation,
  BuildCheckboxHandler,
  BuildHoverHandler,
  BuildKeyHandler,
  BuildCustomEventHandler,
  Key,
  KeyMatch,
} from "../../drjs/browser/event.js";
import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import {
  BuildDragHandler,
  BuildDropHandler,
} from "../../drjs/browser/event.js";
import {
  HtmlTemplate,
  ClassValue,
  DataValue,
  InputValue,
  HtmlValue,
} from "../../drjs/browser/html-template.js";
import { Dialog } from "../controls/dialog.js";
import { OnNextLoop } from "../../drjs/browser/timer.js";
import { imageWindow } from "../controls/image-window.js";
import MediaEntity from "../data/media-entity.js";
const log = Logger.create("TagManager", LOG_LEVEL.DEBUG);

function sortTagPaths(tags) {
  const paths = tags.map((t) => {
    return media.getTagPath(t).substring(1).split("/");
  });
  const sorted = paths.sort((a, b) => {
    for (let step = 0; step < a.length && step < b.length; step++) {
      const diff = a[step].localeCompare(b[step]);
      if (diff != 0) {
        return diff;
      }
    }
    return a.length - b.length;
  });
  return paths.map((p) => {
    return "/" + p.join("/");
  });
}

function stopBrowserClose(event) {
  // Cancel the event as stated by the standard.
  event.preventDefault();
  // Chrome requires returnValue to be set.
  event.returnValue = "";
}

export class QuickTagsComponent extends ComponentBase {
  constructor(selector, htmlName = "quick-tags") {
    super(selector, htmlName);
    this.listeners = new Listeners();
    this.dropHandler = null;

    media.clearFilter();
    media.addFilter(this.filterItem.bind(this));
  }

  onDetach() {
    this.listeners.removeAll();
    window.removeEventListener("beforeunload", stopBrowserClose, true);
  }

  async onHtmlInserted(parent) {
    //window.addEventListener("beforeunload", stopBrowserClose, true);
    this.visibleItems = media.getVisibleItems();
    this.settings = await Settings.load("quick-tags");
    this.tags = media.getTags();
    this.hotkeys = this.settings.get("hotkeys", {});
    this.searchText = "";
    this.searchCursorPosition = 0;
    this.nodeTemplate = new HtmlTemplate(
      this.dom.first(".quick-tag-tree-node-template")
    );
    this.keyTemplate = new HtmlTemplate(
      this.dom.first(this.dom.first(".quick-tag-key-template"))
    );
    this.imageWindow = imageWindow;

    this.dom.check('[name="untagged"]');
    this.untaggedOnly = true;
    this.recent = [];

    this.listeners.add(
      BuildCheckboxHandler()
        .listenTo(this.dom, "[name='untagged']")
        .setData(this, this.getNodeTag)
        .onChecked(this, this.filterUntaggedOnly)
        .onUnchecked(this, this.filterAllFiles)
        .build(),
      BuildInputHandler()
        .listenTo(this.dom, ".hotkey input")
        .setData(this, this.getNodeTag)
        .onInput(this, this.onHotkeyChange)
        .build(),
      BuildHoverHandler()
        .listenTo(this.dom, ".tag-tree .self")
        .onStart(this, this.hoverStart)
        .onEnd(this, this.hoverEnd)
        .build(),
      BuildKeyHandler()
        .setDefaultContinuation(Continuation.Continue)
        .filterAllow((event) => {
          let active = document.activeElement;
          return active == null || active.tagName != "INPUT";
        })
        .onKey("Backspace", this, this.searchBackspace)
        .onKey("ArrowRight", this, this.nextImage)
        .onKey("ArrowLeft", this, this.previousImage)
        .onKey("[", this, this.rotateCCW)
        .onKey("]", this, this.rotateCW)
        // .onKey(Key.Escape, () => {
        //   this.dom.blur(this.dom.getFocus());
        // })
        .onKey(Key.Tab.withoutShift(), this, this.nextTag)
        .onKey(Key.Tab.withShift(), this, this.prevTag)
        .onKey(Key.Regex(/[0-9]/).withCtrl(), this, this.selectRecent)
        .onKey(Key.Regex(/[a-z]/).withCtrl(), this, this.selectHotkey)
        .onKey(
          Key.Regex(/[a-zA-Z0-9\/]/)
            .withoutAlt()
            .withoutCtrl(),
          this,
          this.keyPress
        )
        .build(),
      BuildClickHandler()
        .setDefaultContinuation(Continuation.StopAll)
        .listenTo(this.dom, ".big-view")
        .onClick(this, this.openPreviewWindow)
        .build(),
      BuildClickHandler()
        .setDefaultContinuation(Continuation.StopAll)
        .listenTo(this.dom, ".images img")
        .onClick(this, this.onSelectImage)
        .build(),
      BuildCustomEventHandler()
        .emitter(media.getVisibleItems().getUpdatedEvent())
        .onEvent(this, this.onFileChange)
        .build(),
      BuildCheckboxHandler()
        .listenTo(".tag-tree", 'input[type="checkbox"]')
        .setData(this, this.getTagForElement)
        .onChecked(this, this.selectTag)
        .onUnchecked(this, this.unselectTag)
        .build()
    );
    this.createTags();
    this.focusIndex = 0;
    this.fillImages();
  }

  onSelectImage(target, event, handler) {
    let offset = this.dom.getData(target, "offset");
    if (offset != 0) {
      this.focusIndex += offset;
      this.fillImages();
    }
  }

  nextTag() {
    log.debug("nextTag");
  }
  prevTag() {
    log.debug("prevTag");
  }
  async selectRecent(key) {
    log.debug("recent ", key);
    const tag = this.recent[key];
    if (tag != null) {
      if (this.currentImage.hasTag(tag)) {
        await this.unselectTag(tag);
      } else {
        await this.selectTag(tag);
      }
      this.fillImages();
      return Continuation.StopAll;
    }
  }
  async selectHotkey(key) {
    log.debug("hotkey ", key);
    const tag = this.getTagForHotkey(key);
    if (tag != null) {
      if (this.currentImage.hasTag(tag)) {
        await this.unselectTag(tag);
      } else {
        await this.selectTag(tag);
      }
      this.fillImages();
      return Continuation.StopAll;
    }
  }

  getTagForElement(element) {
    const id = this.dom.getDataWithParent(element, "id");
    return media.getTagById(id);
  }

  async addRecent(tag) {
    if (this.recent.includes(tag)) {
      return;
    }
    while (this.recent.length > 10) {
      this.recent.shift();
    }
    this.recent.concat(tag);
    this.fillRecentTags();
  }
  async selectTag(tag) {
    log.debug("select tag ", tag);
    if (!this.currentImage.hasTag(tag)) {
      await media.tagAddFile(tag, this.currentImage);
      this.fillImageTags(this.currentImage);
      this.addRecent(tag);
      this.searchText = "";
      this.searchCursorPosition = 0;
      fillSearch();
    }
  }

  async unselectTag(tag) {
    log.debug("unselect tag ", tag);
    if (this.currentImage.hasTag(tag)) {
      await media.tagRemoveFile(tag, this.currentImage);
      this.fillImageTags(this.currentImage);
      this.searchText = "";
      this.searchCursorPosition = 0;
      fillSearch();
    }
  }

  onFileChange() {
    this.visibleItems = media.getVisibleItems();
    this.fillImages();
  }

  async openPreviewWindow() {
    await this.imageWindow.open();
    this.imageWindow.setImage(this.currentImage);
  }
  nextImage() {
    this.focusIndex += 1;
    this.fillImages();
  }

  previousImage() {
    this.focusIndex -= 1;
    this.fillImages();
  }

  fillImages() {
    const images = this.dom.find(".images", "img");
    //    const visible = media.getVisibleItems();
    // don't get latest visible items since they may have changed
    // want to be able to re-untag media
    const visible = this.visibleItems;
    if (this.focusIndex < 0) {
      this.focusIndex = 0;
    }
    if (this.focusIndex > visible.Length - 1) {
      this.focusIndex = visible.Length - 1;
    }

    this.currentImage = visible.getItemAt(this.focusIndex);
    while (images.length > 0) {
      let img = images.shift();
      let offset = this.dom.getData(img, "offset");
      let item = this.visibleItems.getItemAt(offset + this.focusIndex);
      if (item == null) {
        this.dom.setAttribute(img, "src", "image/1x1.png");
      } else {
        if (this.dom.hasClass(img, "thumb")) {
          this.dom.setAttribute(img, "src", item.getThumbnailUrl());
          this.dom.removeChildren(img, "rotate-90");
          this.dom.removeChildren(img, "rotate-360");
          if (item.RotationDegrees) {
            this.dom.addClass(
              img,
              `rotate-${(item.RotationDegrees + 360) % 360}`
            );
          }
        } else {
          this.dom.setAttribute(img, "src", item.getImageReloadUrl());
        }
      }
    }

    this.fillImageTags(this.currentImage);
    this.checkTagTree(this.currentImage);
  }

  fillImageTags(image) {
    const container = this.dom.first(".image-tags");
    this.dom.removeChildren(container);

    if (image != null) {
      for (let tag of sortTagPaths(image.Tags)) {
        const child = this.dom.createElement(`<div>${tag}</div>`);
        this.dom.append(container, child);
      }
    }
  }

  checkTagTree(image) {
    const tree = this.dom.first(".tag-tree");
    const tags = this.dom.find(
      tree,
      ".tag.node > .self input[type='checkbox']"
    );
    for (let tagElement of tags) {
      const tag = this.getTagForElement(tagElement);
      if (tag) {
        // don't use this.dom to check.  it sends event we don't want
        tagElement.checked = image.hasTag(tag);
      }
    }
  }

  async rotateCW() {
    if (this.currentImage) {
      this.currentImage.rotate(90);
      await media.updateDatabaseItems();
      this.fillImages();
    }
  }

  async rotateCCW() {
    if (this.currentImage) {
      this.currentImage.rotate(-90);
      await media.updateDatabaseItems();

      this.fillImages();
    }
  }

  hoverStart(target) {
    log.debug(
      "hover end blur ",
      target,
      this.dom.getDataWithParent(target, "id")
    );
    log.debug("old focus: ", document.activeElement);
    this.dom.setFocus(target, 'input[name="hotkey"]');
    log.debug("new focus: ", document.activeElement);
  }

  hoverEnd(target) {
    log.debug(
      "hover end blur ",
      target,
      this.dom.getDataWithParent(target, "id")
    );
    // this.dom.blur(target, 'input[name="hotkey"]');
  }

  getNodeTag(target, event) {
    const id = this.dom.getDataWithParent(target, "id");
    return media.getTagById(id);
  }
  filterAllFiles() {
    media.clearFilter();
  }

  filterUntaggedOnly() {
    media.clearFilter();
    media.addFilter(this.filterItem.bind(this));
    this.createTags();
    this.focusIndex = 0;
    this.fillImages();
  }
  filterItem(item) {
    if (!this.untaggedOnly) {
      return true;
    }
    return item.Tags.length == 0;
  }

  setHotkey(tag, key) {
    if (tag == null) {
      return;
    }
    if (key == "w") {
      alert(
        "CTRL-w cannot be used as a hotkey. The browser uses it to close the window."
      );
      return;
    }
    for (var oldKey of Object.keys(this.hotkeys)) {
      let oldTagId = this.hotkeys[oldKey];
      if (oldTagId == tag.Id) {
        delete this.hotkeys[oldKey];
      }
    }
    if (key != null) {
      var oldHotkey = this.getTagForHotkey(key);
      if (oldHotkey != key) {
        this.hotkeys[key] = tag.Id;
        this.settings.set("hotkeys", this.hotkeys);
      }
    }
  }

  getHotkeyForTag(tag) {
    for (var key of Object.keys(this.hotkeys)) {
      var tagId = this.hotkeys[key];
      if (tagId == tag.Id) {
        return key;
      }
    }
    return null;
  }

  getTagForHotkey(key) {
    const tagId = this.hotkeys[key];
    if (tagId != null) {
      return media.getTagById(tagId);
    }
    return null;
  }

  onHotkeyChange(tag, value, target) {
    log.debug("hotkey change ", value, tag.Name);
    let key = value.slice(-1).toLowerCase().trim();
    if (key == "") {
      this.setHotkey(tag, null);
      this.fillHotkeys();
      return Continuation.StopAll;
    }
    if (key >= "a" && key <= "z") {
      const old = this.getTagForHotkey(key);
      this.setHotkey(old, null);
      target.value = key;
      this.setHotkey(tag, key);
      // createtags rebuilds tree and loses focus
      //this.createTags();
      this.fillHotkeys();
      return Continuation.StopAll;
    }
  }

  createTags() {
    this.fillTree();
    this.fillRecentTags();
    this.fillHotkeys();
  }

  fillRecentTags() {
    const recent = this.dom.first(".recent");
    this.dom.removeChildren(recent);
    if (this.recent.length == 0) {
      const noItems = this.dom.createElement("div", {
        "@class": "no-items",
        html: "no recent items",
      });
      this.dom.append(recent, noItems);
    }
    for (var idx = 0; idx < 10; idx++) {
      const tag = this.recent[idx];
      if (tag != null) {
        const row = this.keyTemplate.fill({
          ".ctrl-key": idx,
          ".tag-name": [
            new DataValue("id", tag.Id),
            new HtmlValue(media.getTagPath(tag)),
          ],
        });
        this.dom.append(recent, row);
      }
    }
  }

  fillHotkeys() {
    const hotkeys = this.dom.first(".keys");
    this.dom.removeChildren(hotkeys);
    for (var key of Object.keys(this.hotkeys).sort()) {
      const tag = this.hotkeys[key];
      if (tag != null) {
        const row = this.keyTemplate.fill({
          ".ctrl-key": key,
          ".tag-name": [
            new DataValue("id", tag.Id),
            new HtmlValue(media.getTagPath(tag)),
          ],
        });
        this.dom.append(hotkeys, row);
      }
    }
  }

  fillTree() {
    this.tags = media.getTags();

    const scroll = this.dom.first(".tag-tree");
    const scrollTop = scroll.scrollTop;
    const top = this.tags.search((tag) => {
      return tag.ParentId == null;
    });
    const parent = this.dom.first(".tag-tree .tags");
    this.dom.removeChildren(parent);

    this.insertTags(parent, top);
    log.debug("scroll to ", scrollTop);
    OnNextLoop(() => scroll.scrollTo(0, scrollTop));
  }

  insertTags(parent, tags) {
    this.dom.toggleClass(parent, "empty", tags.length == 0);
    tags.sort((a, b) => {
      return a.Name.localeCompare(b.Name);
    });
    for (var tag of tags) {
      const element = this.nodeTemplate.fill({
        ".tag": new DataValue("id", tag.id),
        ".name": tag.name,
        ".hotkey input": this.getHotkeyForTag(tag),
      });
      this.dom.append(parent, element);
      const childTags = this.tags.search((child) => {
        return child.ParentId == tag.Id;
      });

      const children = this.dom.first(element, ".children");
      this.insertTags(children, childTags);
    }
  }

  keyPress(key) {
    log.debug("press ", key);
    log.debug("input ", document.activeElement);
    if (document.activeElement != document.body) {
      // don't do anything if another element has focus
      log.debug("ignore");
      return Continuation.Continue;
    }
    this.searchText = this.searchText.concat(key);
    this.searchCursorPosition += 1;
    this.fillSearch();
    return Continuation.StopAll;
  }

  searchBackspace() {
    this.searchText = this.searchText.slice(0, -1);
    this.fillSearch();
    return Continuation.StopAll;
  }
  fillSearch() {
    this.dom.setInnerHTML(".search .start", this.searchText);
    this.dom.toggleClass(".search", "active", this.searchText.length > 0);
  }
}
