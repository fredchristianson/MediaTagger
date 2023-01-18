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
        .setDefaultContinuation(Continuation.StopAll)
        // .filterAllow((event) => {
        //   // only handle if an input/select/textarea doesn't have focus
        //   return document.activeElement == document.body;
        // })
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
    }
  }
  keyPress(key) {
    log.debug("press ", key);
    return Continuation.Continue;
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
    this.recent.push(tag);
    this.fillRecentTags();
  }
  async selectTag(tag) {
    log.debug("select tag ", tag);
    if (!this.currentImage.hasTag(tag)) {
      await media.tagAddFile(tag, this.currentImage);
      this.fillImageTags(this.currentImage);
      this.addRecent(tag);
    }
  }

  async unselectTag(tag) {
    log.debug("unselect tag ", tag);
    if (this.currentImage.hasTag(tag)) {
      await media.tagRemoveFile(tag, this.currentImage);
      this.fillImageTags(this.currentImage);
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
    media.getLastFocusIndex(this.focusIndex);
    this.currentImage = visible.getItemAt(this.focusIndex);
    this.imageWindow.setImage(this.currentImage);
    for (var idx = this.focusIndex - 3; idx <= this.focusIndex + 3; idx++) {
      var item = visible.getItemAt(idx);
      const image = images.shift();
      this.dom.removeClass(image, `rotate-270`);
      this.dom.removeClass(image, `rotate-90`);
      if (item == null) {
        this.dom.setAttribute(image, "src", "image/1x1.png");
      } else {
        if (idx == this.focusIndex) {
          this.dom.setAttribute(image, "src", item.getImageReloadUrl());
        } else {
          //this.dom.setAttribute(image, "src", item.getThumbnailUrl());
          log.never("set image", image, " to " + item.getThumbnailUrl());
          if (item.RotationDegrees) {
            this.dom.addClass(
              image,
              `rotate-${(item.RotationDegrees + 360) % 360}`
            );
          }
          image.src = item.getThumbnailUrl() + "&b=" + Date.now();
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
    this.dom.setFocus(target, 'input[name="hotkey"]');
  }

  hoverEnd(target) {
    this.dom.blur(target, 'input[name="hotkey"]');
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
    if (key == "w") {
      alert(
        "CTRL-w cannot be used as a hotkey. The browser uses it to close the window."
      );
      return;
    }
    var oldTag = this.getHotkeyForTag(tag);
    var oldHotkey = this.getTagForHotkey(key);
    if (oldHotkey != key) {
      this.hotkeys[key] = tag.Id;
      this.settings.set("hotkeys", this.hotkeys);
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

  onHotkeyChange(tag, key, target) {
    key = key.toLowerCase();
    if (key >= "a" && key <= "z") {
      target.value = key;
      this.setHotkey(tag, key);
      this.createTags();
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

  async onAdd(parent) {
    const id = parent == null ? null : parent.Id;
    log.debug("add tag with parent ", id);
    const form = this.addTemplate.fill({
      ".parent": parent == null ? "/" : media.getTagPath(id),
      "[name='parentId']": id,
    });
    const dialog = new Dialog(form, async (values) => {
      log.debug("add ", values);
      const tag = await media.createTag(id, values.name);
      this.createTags();
      var element = this.dom.first(`.tag[data-id='${tag.Id}']`);
      this.dom.addClass(element, "new");
      this.dom.removeClass(element, "new");
      return true;
    });
    dialog.show();
  }

  async onEdit(tag) {
    log.debug("add tag ", tag.Id, tag.Name);
    const form = this.editTemplate.fill({
      ".parent": media.getTagPath(tag.ParentId),
      "[name='name']": new InputValue(tag.Name),
      "[name='tagId']": new InputValue(tag.id),
    });
    const dialog = new Dialog(form, async (values) => {
      log.debug("add ", values);
      const update = await media.updateTag(tag.Id, values.name, tag.ParentId);
      this.createTags();
      var element = this.dom.first(`.tag[data-id='${tag.Id}']`);
      this.dom.addClass(element, "new");
      this.dom.removeClass(element, "new");
      return true;
    });
    dialog.show();
  }

  async onHide(tag) {
    log.debug("hide tag ", tag.Id, tag.Name);
    await media.updateTag(tag.Id, tag.Name, tag.ParentId, true);
    this.createTags();
  }

  onDragStart(target, event) {
    this.dragging = target;
    log.debug("drag start");
    this.dom.addClass(target, "dragging");
    this.dropHandler = BuildDropHandler()
      .listenTo(".tag")
      .onOver((target) => {
        this.dom.addClass(target, "drag-over");
      })
      .onLeave((target) => {
        this.dom.removeClass(target, "drag-over");
      })
      .onDrop(this, this.drop)
      .build();
  }
  onDragEnd(target, event) {
    log.debug("drag end");
    this.dom.removeClass(target, "dragging");
  }
  onDrag(target, event) {
    log.debug("drag ");
  }

  async drop(target, event) {
    log.debug("drop");
    this.dom.removeClass(target, "drag-over");
    const moveTagId = this.dom.getData(this.dragging, "id");
    var moveToId = this.dom.getData(target, "id");
    const tag = media.getTagById(moveTagId);
    if (moveToId == "root") {
      moveToId = null;
    }
    await media.updateTag(tag.Id, tag.Name, moveToId);
    this.createTags();
    var element = this.dom.first(`.tag[data-id='${moveTagId}']`);
    this.dom.addClass(element, "new");
    this.dom.removeClass(element, "new");
    log.debug("move ", moveTagId, " to ", moveToId);
  }
}
