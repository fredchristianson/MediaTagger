import { ComponentBase } from "../../drjs/browser/component.js";
import { Settings } from "../modules/settings.js";
import { Tree, TreeDataProvider, TreeItem } from "../controls/tree.js";
import { media } from "../modules/media.js";
import {
  Listeners,
  BuildInputHandler,
  BuildClickHandler,
  Continuation,
  BuildCheckboxHandler,
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
} from "../../drjs/browser/html-template.js";
import { Dialog } from "../controls/dialog.js";
const log = Logger.create("TagManager", LOG_LEVEL.DEBUG);

export class QuickTagsComponent extends ComponentBase {
  constructor(selector, htmlName = "quick-tags") {
    super(selector, htmlName);
    this.listeners = new Listeners();
    this.dropHandler = null;
  }

  onDetach() {
    this.listeners.removeAll();
  }

  async onHtmlInserted(parent) {
    this.settings = await Settings.load("quick-tags");
    this.tags = media.getTags();
    this.nodeTemplate = new HtmlTemplate(
      this.dom.first(".quick-tag-tree-node-template")
    );
    this.keyTemplate = new HtmlTemplate(
      this.dom.first(this.dom.first(".quick-tag-key-template"))
    );

    this.dom.check('[name="untagged"]');
    this.untaggedOnly = true;
    media.clearFilter();
    media.addFilter(this.filterItem.bind(this));
    this.listeners.add(
      BuildCheckboxHandler()
        .listenTo(this.dom, "[name='untagged']")
        .setData(this, this.getNodeTag)
        .onChecked(this, this.untaggedOnly)
        .onUnchecked(this, this.allFiles)
        .build(),
      BuildInputHandler()
        .listenTo(this.dom, ".hotkey input")
        .setData(this, this.getNodeTag)
        .onInput(this, this.onHotkeyChange)
        .build()
    );
    this.createTags();
  }

  getNodeTag(event) {
    const id = this.dom.getDataWithParent(event.target, "id");
    return media.getTagById(id);
  }
  allFiles() {
    media.clearFilter();
  }

  untaggedOnly() {
    media.clearFilter();
    media.addFilter(this.filterItem.bind(this));
  }
  filterItem(item) {
    if (!this.untaggedOnly) {
      return true;
    }
    return item.Tags.Length == 0;
  }

  onHotkeyChange(tag, key, target) {
    key = key.toLowerCase();
    if (key >= "a" && key <= "z") {
      target.value = key;
      this.settings.set(`hotkey-${tag.id}`, key);
    }
    return Continuation.StopAll;
  }

  createTags() {
    this.tags = media.getTags();

    const scroll = this.dom.first(".tag-tree");
    const scrollTop = scroll.scrollTop;
    const top = this.tags.search((tag) => {
      return tag.ParentId == null;
    });
    const parent = this.dom.first(".tag-tree .tags");
    this.dom.removeChildren(parent);

    this.insertTags(parent, top);
    scroll.scrollTo(0, scrollTop);
  }

  insertTags(parent, tags) {
    tags.sort((a, b) => {
      return a.Name.localeCompare(b.Name);
    });
    for (var tag of tags) {
      const element = this.nodeTemplate.fill({
        ".tag": new DataValue("id", tag.id),
        ".name": tag.name,
        ".hotkey input": this.settings.get(`hotkey-${tag.id}`),
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
