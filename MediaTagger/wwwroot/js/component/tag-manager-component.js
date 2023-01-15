import { ComponentBase } from "../../drjs/browser/component.js";
import {
  getAppSettings,
  postAppSettings,
  getTopFolders,
  getFolders,
} from "../modules/mt-api.js";
import { Tree, TreeDataProvider, TreeItem } from "../controls/tree.js";
import { media } from "../modules/media.js";
import {
  Listeners,
  BuildInputHandler,
  BuildClickHandler,
  EventHandlerReturn,
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

export class TagManagerComponent extends ComponentBase {
  constructor(selector, htmlName = "tag-manager") {
    super(selector, htmlName);
    this.listeners = new Listeners();
    this.dropHandler = null;
  }

  onDetach() {
    this.listeners.removeAll();
  }

  async onHtmlInserted(parent) {
    this.tags = media.getTags();
    this.template = new HtmlTemplate(
      this.dom.first("#tag-manager-tag-template")
    );
    this.addTemplate = new HtmlTemplate(
      this.dom.first(this.dom.first(".new-tag-dialog"))
    );
    this.editTemplate = new HtmlTemplate(
      this.dom.first(this.dom.first(".edit-tag-dialog"))
    );

    this.listeners.add(
      BuildDragHandler()
        .listenTo(this.dom.first(".tag-tree"), ".tag")
        .setDefaultResponse(EventHandlerReturn.Continue)
        .onStart(this, this.onDragStart)
        .onEnd(this, this.onDragEnd)
        .onDrag(this, this.onDrag)
        .build(),
      BuildClickHandler()
        .listenTo(this.dom, "button.edit")
        .setData((target) => {
          return media.getTagById(this.dom.getDataWithParent(target, "id"));
        })
        .onClick(this, this.onEdit)
        .build(),
      BuildClickHandler()
        .listenTo(this.dom, "button.add")
        .setData((target) => {
          return media.getTagById(this.dom.getDataWithParent(target, "id"));
        })
        .onClick(this, this.onAdd)
        .build()
    );
    this.createTags();
  }

  createTags() {
    const scroll = this.dom.first(".tag-tree");
    const scrollTop = scroll.scrollTop;
    const top = this.tags.search((tag) => {
      return tag.ParentId == null;
    });
    const parent = this.dom.first(".tag-tree");
    this.dom.removeChildren(parent);
    const element = this.template.fill({
      ".tag": [new DataValue("id", "root"), new ClassValue("root")],
      ".name": "/",
    });
    this.dom.append(parent, element);
    this.insertTags(parent, top);
    scroll.scrollTo(0, scrollTop);
  }

  insertTags(parent, tags) {
    tags.sort((a, b) => {
      return a.Name.localeCompare(b.Name);
    });
    for (var tag of tags) {
      const element = this.template.fill({
        ".tag": new DataValue("id", tag.id),
        ".name": tag.name,
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
