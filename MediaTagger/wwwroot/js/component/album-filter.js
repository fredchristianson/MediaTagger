import { ComponentBase } from "../../drjs/browser/component.js";
import {
  BuildCheckboxHandler,
  BuildHoverHandler,
  BuildInputHandler,
  EventHandlerReturn,
  Listeners,
  StopAllHandlerReturn,
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
import Album from "../data/album.js";
import { Dialog } from "../controls/dialog.js";

const log = Logger.create("AlbumComponent", LOG_LEVEL.DEBUG);

function NameCompareFunction(a, b) {
  if (a == null) {
    return -1;
  }
  if (b == null) {
    return -1;
  }
  return a.getName().localeCompare(b.getName());
}

async function createAlbum(values) {
  log.info("createAlbum ", values);
  try {
    var result = await media.createAlbum(values.name, values.description);
    if (result && result instanceof Album) {
      return true;
    }
    return (
      (result && result.message) ?? "Create Album " + values.name + " failed."
    );
  } catch (response) {
    return (
      (response && response.message) ??
      "Create Album " + values.name + " failed."
    );
  }
}

function cancelCreateAlbum() {
  log.info("createAlbum canceled");
}

export class AlbumFilterComponent extends ComponentBase {
  constructor(selector, htmlName = "album-filter") {
    super(selector, htmlName);
    this.listeners = new Listeners();
    this.media = media;
  }

  async onHtmlInserted(elements) {
    this.settings = await Settings.load("album-filter", {});

    this.template = new HtmlTemplate(this.dom.first(".album-filter-template"));
    this.newTemplate = new HtmlTemplate(this.dom.first(".new-album-dialog"));

    this.listeners.add(
      BuildCheckboxHandler()
        .listenTo(this.dom.first("ul"), "input[type='checkbox']")
        .onChange(this, this.selectChanged)
        .setData((element) => {
          return this.dom.getDataWithParent(element, "id");
        })
        .build(),
      BuildClickHandler()
        .listenTo("#album-filter", ".add-album")
        .setDefaultResponse(EventHandlerReturn.StopAll)
        .capture()
        .onClick(this, this.addAlbum)
        .build(),
      media
        .getAlbums()
        .getUpdatedEvent()
        .createListener(this, this.onAlbumListChange)
    );
    this.onAlbumListChange();
    media.addFilter(this.filterItem.bind(this));
  }

  addAlbum() {
    log.debug("add album");
    var dialog = new Dialog(this.newTemplate, createAlbum, cancelCreateAlbum);
    dialog.show();
  }

  onAlbumListChange() {
    var albums = media.getAlbums();
    var list = this.dom.first("ul.albums");
    this.dom.removeChildren(list);
    if (albums.Length == 0) {
      //var li = this.dom.createElement("li", "no albums exist");
      var li = this.dom.createElement(
        "<li><a class='add-album' href='#'>create album</a></li>"
      );
      this.dom.append(list, li);
      return;
    }

    var sorted = [...albums].sort(NameCompareFunction);
    for (var album of sorted) {
      var state = this.settings.get(`album-state-${album.getId()}`, "checked");
      var listItem = this.template.fill({
        li: new DataValue("id", album.getId()),
        ".check-state": new DataValue("state", state),
        "input.check": new PropertyValue("checked", state == "checked"),
        "span.name": album.getName(),
      });
      this.dom.append(list, listItem);
    }
  }

  selectChanged(id, val, element) {
    log.debug("id change ", id, val);
    var state = val ? "checked" : "unchecked";
    this.settings.set(`album-state-${id}`, state);
    var label = this.dom.parent(element, ".check-state");
    this.dom.setData(label, "state", state);
    FilterChangeEvent.emit();
  }

  filterItem(item) {
    const checks = this.dom.find("input.check");
    const checked = checks.find((c) => {
      return c.checked;
    });
    return checked;
  }
}

export default AlbumFilterComponent;
