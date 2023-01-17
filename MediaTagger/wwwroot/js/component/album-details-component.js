import { ComponentBase } from "../../drjs/browser/component.js";
import {
  BuildCheckboxHandler,
  BuildCustomEventHandler,
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
import Album from "../data/album.js";
import { Dialog } from "../controls/dialog.js";
import { dom } from "../../drjs/browser/dom.js";

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

class AlbumDetailsComponent extends ComponentBase {
  constructor(selector, htmlName = "album-details") {
    super(selector, htmlName);
    this.listeners = new Listeners();
    this.media = media;
  }

  async onHtmlInserted(elements) {
    this.template = new HtmlTemplate(this.dom.first(".album-details-template"));

    this.listeners.add(
      BuildCheckboxHandler()
        .listenTo(this.dom.first("ul"), "input[type='checkbox']")
        .onChecked(this, this.albumSelected)
        .onUnchecked(this, this.albumUnselected)
        .setData((element) => {
          return this.dom.getDataWithParent(element, "id");
        })
        .build(),
      BuildCustomEventHandler()
        .emitter(media.getAlbums().getUpdatedEvent())
        .onEvent(this, this.onAlbumListChange)
        .build(),
      BuildCustomEventHandler()
        .emitter(media.getSelectedItems().getUpdatedEvent())
        .onEvent(this, this.onSelectionChange())
        .build(),
      BuildCustomEventHandler()
        .emitter(FocusChangeEvent)
        .onEvent(this, this.onSelectionChange())
        .build()
    );
    this.onAlbumListChange();
    this.onSelectionChange();
  }

  onSelectionChange() {
    const selected = media.getSelectedItems();
    if (selected.Length == 0) {
      this.dom.hide("input.check");
      return;
    }
    this.dom.show("input.check");

    var selectedAlbums = {};
    for (var sel of selected) {
      for (var album of sel.getAlbums()) {
        var st = selectedAlbums[album.getId()];
        if (st == null) {
          st = { id: album.getId(), count: 0 };
          selectedAlbums[album.getId()] = st;
        }
        st.count += 1;
      }
    }

    var checks = this.dom.find("input.check");
    const count = selected.Length;
    checks.forEach((check) => {
      var id = this.dom.getDataWithParent(check, "id");
      var st = selectedAlbums[id];
      var tagElement = this.dom.closest(check, "label");
      this.dom.show(tagElement, st != null);
      if (st == null) {
        this.dom.uncheck(check);
        this.dom.removeClass(tagElement, "partial");
      } else {
        this.dom.check(check);
        this.dom.toggleClass(tagElement, "partial", st.count < count);
      }
    });
  }

  onAlbumListChange() {
    this.dom.removeChildren("ul.items.album-list");
    var albums = media.getAlbums();
    for (var album of albums) {
      const item = this.template.fill({
        "input.check": new DataValue("id", album.getId()),
        "span.name": album.getName(),
      });
      this.dom.append("ul.items.album-list", item);
    }
  }

  albumSelected(id) {
    log.debug("selected album ", id);
    media.albumAddSelected(id);
  }

  albumUnselected(id) {
    media.albumRemoveSelected(id);
  }
}

export { AlbumDetailsComponent };
