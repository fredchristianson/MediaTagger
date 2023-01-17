import { ComponentBase } from "../../drjs/browser/component.js";

import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import {
  Listeners,
  BuildClickHandler,
  BuildKeyHandler,
  BuildScrollHandler,
  BuildFocusHandler,
  BuildCheckboxHandler,
  Continuation,
  BuildCustomEventHandler,
} from "../../drjs/browser/event.js";

var recentTags = [];

import Media, { media } from "../modules/media.js";
import HtmlTemplate, {
  ClassValue,
  DataValue,
  PropertyValue,
} from "../../drjs/browser/html-template.js";
import { toggleClass } from "../modules/dom-watcher.js";

const log = Logger.create("MediaFileEditor", LOG_LEVEL.DEBUG);

function matchScoreComparison(a, b) {
  if (a.Score == b.Score) {
    return a.Label.localeCompare(b.Label);
  }
  return b.Score - a.Score;
}

function lengthComparison(a, b) {
  return a.length - b.length;
}

class Option {
  constructor(type, id, label, item) {
    this.item = item;
    this.id = id;
    this.label = label;
    this.lowerCaseLabel = this.label.toLowerCase();
    this.score = 0;
    this.html = label;
    this.type = type;
  }

  get Label() {
    return this.label;
  }
  get Score() {
    return this.score;
  }

  calculateScore(words) {
    this.score = 0;
    var found = [];
    var rest = this.lowerCaseLabel;
    words.forEach((word) => {
      const idx = rest.indexOf(word.toLowerCase());
      if (idx >= 0) {
        found.push(word.toLowerCase());
        rest = rest.substring(idx + word.length);
      }
    });
    this.score =
      found.length * 100 +
      found.reduce((sum, w) => {
        sum += w.length * 10;
        return sum;
      }, 0);

    rest = this.label;
    this.html = "";
    found.forEach((word) => {
      const idx = rest.toLowerCase().indexOf(word);
      if (idx >= 0) {
        this.html += rest.substring(0, idx);
        this.html +=
          "<span class='match'>" +
          rest.substring(idx, idx + word.length) +
          "</span>";
        rest = rest.substring(idx + word.length, rest.length);
      }
    });
    this.html += rest;
    this.score += this.getTypeScore();
  }
  getTypeScore() {
    return 0;
  }
}

class TagOption extends Option {
  constructor(id, label, item) {
    super("tag", id, label, item);
  }
  getTypeScore() {
    var pos = recentTags.indexOf(this.id);
    if (pos > 0) {
      return pos;
    }
    return 0;
  }
}

class AlbumOption extends Option {
  constructor(id, label, item) {
    super("tag", id, label, item);
  }
}

export class MediaFileEditorComponent extends ComponentBase {
  constructor(selector, htmlName = "media-file-editor") {
    super(selector, htmlName);
    this.listeners = new Listeners();
    this.item = null;
    this.tagCounts = {};
    this.albumCounts = {};
    this.highlightIndex = 0;
  }

  async onHtmlInserted(elements) {
    this.listeners.add(
      BuildCheckboxHandler()
        .setDefaultContinuation(Continuation.StopAll)
        .capture()
        .listenTo(this.dom, '.tags input[type="checkbox"]')
        .onChecked(this, this.selectTag)
        .onUnchecked(this, this.unselectTag)
        .setData((target) => {
          return media.getTagById(this.dom.getData(target, "id"));
        })
        .build(),
      BuildCheckboxHandler()
        .setDefaultContinuation(Continuation.StopAll)
        .listenTo(this.dom, '.albums input[type="checkbox"]')
        .onChecked(this, this.selectAlbum)
        .onUnchecked(this, this.unselectAlbum)
        .setData((target) => {
          return media.getAlbumById(this.dom.getData(target, "id"));
        })
        .build(),
      BuildCustomEventHandler()
        .emitter(media.getTags().getUpdatedEvent())
        .onEvent(this, this.onTagChange)
        .build(),
      BuildCustomEventHandler()
        .emitter(media.getAlbums().getUpdatedEvent())
        .onEvent(this, this.onAlbumChange)
        .build()
    );
    this.optionTemplate = new HtmlTemplate(
      this.dom.first(".editor-option-template")
    );
    this.search = "";
  }

  onTagChange() {
    this.fillMatches();
  }

  onAlbumChange() {
    this.fillMatches();
  }

  getTagOptions() {
    return [...media.getTags()].map((tag) => {
      return new TagOption(tag.getId(), media.getTagPath(tag), tag);
    });
  }
  getAlbumOptions() {
    return [...media.getAlbums()].map((album) => {
      return new AlbumOption(album.getId(), album.getName(), album);
    });
  }

  setItem(item) {
    if (item == this.item) {
      return;
    }
    this.highlightIndex = 0;
    this.item = item;
    this.tagOptions = this.getTagOptions();
    this.albumOptions = this.getAlbumOptions();
    this.dom.show(".group-buttons", false); // media.getSelectedItems().Length > 1);
    this.search = "";
    this.dom.setInnerHTML(".key-presses", "");
    this.fillMatches();
  }
  async groupSelectedItems() {
    log.debug("group selected items");
    Media.groupSelectedItems(this.activeItem);
    this.hidePopup();
  }

  async ungroupItem() {
    log.debug("ungroup item");
    Media.ungroup(this.activeItem);
    this.hidePopup();
  }

  async onDetach() {
    this.listeners.removeAll();
  }

  sortMatches(list, counts) {
    const words = this.search.trim().split(/\s+/);
    list.forEach((item) => {
      item.calculateScore(words);
    });
    list.sort(matchScoreComparison);
  }
  fillMatches() {
    this.tagOptions = this.getTagOptions();
    this.albumOptions = this.getAlbumOptions();

    this.sortMatches(this.tagOptions, this.tagCounts);
    this.sortMatches(this.albumOptions, this.albumCounts);
    this.dom.removeChildren(".tags ul");
    this.dom.removeChildren(".albums ul");
    this.fillOptions(this.dom.first(".tags ul"), this.tagOptions);
    this.fillOptions(this.dom.first(".albums ul"), this.albumOptions);
  }

  fillOptions(parent, list) {
    this.dom.removeChildren(parent);
    for (var i = 0; i < 20 && i < list.length; i++) {
      const item = list[i];
      const checked = item.item.hasFile(media.getFocus());
      const key = i < 10 ? i : "";
      const highlight = i == this.highlightIndex % list.length;
      const option = this.optionTemplate.fill({
        label: new ClassValue(highlight ? "highlight" : null),
        ".key": key,
        "input[type='checkbox']": [
          new DataValue("id", item.id),
          new PropertyValue("checked", checked),
        ],
        ".name": item.html,
      });
      this.dom.append(parent, option);
    }
  }
  async searchKey(key, shift = false) {
    if (key == "Backspace") {
      this.search = this.search.substring(0, this.search.length - 1);
    } else if (key == "Tab") {
      this.highlightIndex = (this.highlightIndex + (shift ? -1 : 1)) % 20;
    } else if (key == "Enter") {
      if (shift) {
        await this.toggleHighlightedAlbum();
      } else {
        await this.toggleHighlightedTag();
      }
      this.search = "";
    } else if (key.length == 1) {
      if ((key >= "a" && key <= "z") || (key >= "A" && key <= "Z")) {
        this.search += key;
      } else {
        this.search += " ";
      }
    }
    this.dom.setInnerHTML(".key-presses", this.search);
    this.fillMatches();
  }

  async toggleHighlightedTag() {
    const opt = this.tagOptions[this.highlightIndex];
    const focus = media.getFocus();
    if (opt == null || opt.item == null || focus == null) {
      return;
    }
    const tag = opt.item;
    if (tag.hasFile(focus)) {
      await this.unselectTag(tag);
    } else {
      await this.selectTag(tag);
    }
  }
  async toggleHighlightedAlbum() {
    const opt = this.albumOptions[this.highlightIndex];
    const focus = media.getFocus();
    if (opt == null || opt.item == null || focus == null) {
      return;
    }
    const album = opt.item;
    if (album.hasFile(focus)) {
      await this.unselectAlbum(album);
    } else {
      await this.selectAlbum(album);
    }
  }
  async altKey(key) {
    if (key < "0" || key > "9") {
      return;
    }
    var idx = Number.parseInt(key);
    var opt = this.albumOptions[idx];
    if (opt == null) {
      return;
    }
    var album = opt.item;
    var file = media.getFocus();
    if (file.hasAlbum(album)) {
      await this.unselectAlbum(album);
    } else {
      await this.selectAlbum(album);
    }
    this.albumOptions = this.getAlbumOptions();
    this.fillMatches();
  }
  async ctrlKey(key) {
    if (key < "0" || key > "9") {
      return;
    }
    var idx = Number.parseInt(key);
    var opt = this.tagOptions[idx];
    if (opt == null) {
      return;
    }
    var tag = opt.item;
    var file = media.getFocus();
    if (file.hasTag(tag)) {
      await this.unselectTag(tag);
    } else {
      await this.selectTag(tag);
    }
    this.tagOptions = this.getTagOptions();
    this.fillMatches();
  }
  async selectTag(tag) {
    if (tag == null) {
      return;
    }
    const file = media.getFocus();
    if (!tag.hasFile(file)) {
      await media.tagAddFile(tag, media.getFocus());
    }
    const parent = media.getTagById(tag.ParentId);
    await this.selectTag(parent);
    this.tagOptions = this.getTagOptions();

    recentTags = recentTags.filter((t) => {
      return t != tag.id;
    });
    recentTags.push(tag.id);

    this.fillMatches();
  }
  async unselectTag(tag) {
    if (tag == null) {
      return;
    }
    const file = media.getFocus();
    if (tag.hasFile(file)) {
      await media.tagRemoveFile(tag, media.getFocus());
    }
    this.tagOptions = this.getTagOptions();
    this.fillMatches();
  }
  async selectAlbum(album) {
    if (album == null) {
      return;
    }
    const file = media.getFocus();
    if (!album.hasFile(file)) {
      await media.albumAddFile(album, media.getFocus());
    }
    this.albumOptions = this.getAlbumOptions();
    this.fillMatches();
  }
  async unselectAlbum(album) {
    if (album == null) {
      return;
    }
    const file = media.getFocus();
    if (album.hasFile(file)) {
      await media.albumRemoveFile(album, media.getFocus());
    }
  }
}

export default MediaFileEditorComponent;
