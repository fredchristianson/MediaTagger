import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import { compareDates, compareIds, compareNames } from "../data/helpers.js";
import {
  Tag,
  MediaTag,
  Property,
  PropertyValue,
  MediaFile,
  Album,
  MediaAlbum,
} from "../data/items.js";
import { runParallel, runSerial } from "./task.js";
import { dataAdder, dataLoader, dataUpdater } from "../data/data-loader.js";
import {
  ObservableView,
  SortedObservableView,
  FilteredObservableView,
  ObservableArray,
  ObservableTree,
} from "./collections.js";
import * as API from "./mt-api.js";
import { dbGetMediaFiles, dbSaveMediaFiles } from "../data/database.js";
import { Listeners } from "../../drjs/browser/event.js";
import {
  BuildCustomEventHandler,
  EventEmitter,
  ObjectEventType,
} from "../../drjs/browser/event.js";
import FileGroup from "../data/file-group.js";

const log = Logger.create("Media", LOG_LEVEL.WARN);

export var FilterChangeEventType = new ObjectEventType("FilterChange");
export var FilterChangeEvent = new EventEmitter(FilterChangeEventType, this);

export var FocusChangeEventType = new ObjectEventType("FocusChange");
export var FocusChangeEvent = new EventEmitter(FocusChangeEventType, this);

class Media {
  constructor() {
    this.files = new ObservableArray();
    this.tags = new ObservableTree();

    this.albums = new ObservableArray();
    this.groups = new ObservableArray();
    this.properties = new ObservableArray();
    this.propertyValues = new ObservableArray();
    this.mediaTags = new ObservableArray();
    this.mediaAlbums = new ObservableArray();
    this.showAllGroupFiles = false;
    this.mediaFilterItems = new FilteredObservableView(
      this.files,
      this.mediaFilter.bind(this)
    );
    this.groupFilterItems = new FilteredObservableView(
      this.mediaFilterItems,
      this.primaryFileFilter.bind(this)
    );
    this.searchFilterItems = new FilteredObservableView(
      this.groupFilterItems,
      null
    );
    this.dateFilterItems = new FilteredObservableView(
      this.searchFilterItems,
      null
    );
    this.sortedItems = new SortedObservableView(
      this.dateFilterItems,
      compareDates
    );
    this.visibleItems = new ObservableView(this.sortedItems);
    this.selectedItems = new ObservableView([]);
    this.lastSelect = null; // lastSelect may be toggled off
    this.focus = null;
    this.previousFocus = null;

    this.listeners = new Listeners(
      BuildCustomEventHandler()
        .emitter(this.files.updatedEvent)
        .onEvent(this, this.updateDatabaseItems)
        .build(),

      BuildCustomEventHandler()
        .emitter(FilterChangeEvent)
        .onEvent(this, this.onFilterChanged)
        .build()
    );
    this.filterIncludeFunctions = [];
  }

  getFocusChangeEvent() {
    return FocusChangeEvent;
  }

  clearSelection() {
    this.clearFocus();
    this.selectedItems.clear();
  }
  clearFocus() {
    if (this.focus != null) {
      this.previousFocus = this.focus;
    }
    this.focus = null;
    this.focusIndex = null;

    FocusChangeEvent.emit(null);
  }
  getFocus() {
    return this.focus;
  }
  getFocusIndex() {
    return this.focus == null ? 0 : this.visibleItems.indexOf(this.focus); //this.focusIndex;
  }
  getLastFocusIndex() {
    return this.focusIndex ?? this.visibleItems.indexOf(this.previousFocus);
  }

  setFocus(item) {
    if (this.focus != null) {
      this.previousFocus = this.focus;
    }
    this.focus = item;
    this.focusIndex = this.visibleItems.indexOf(item);
    FilterChangeEvent.emit();
    FocusChangeEvent.emit(item);
  }

  getLastFocus() {
    return this.focus ?? this.previousFocus;
  }

  // updateFocus happens when the item doesn't change, but an attribute does (e.g. rotation)
  async updateFocus() {
    await this.updateDatabaseItems();
    FocusChangeEvent.emit(this.focus);
  }

  clearFilter(func) {
    this.filterIncludeFunctions = [];
    FilterChangeEvent.emit();
  }

  addFilter(func) {
    this.filterIncludeFunctions.push(func);
    FilterChangeEvent.emit();
  }

  onFilterChanged() {
    log.info("media filter changed");
    this.mediaFilterItems.filter();
  }

  isSelected(item) {
    return this.selectedItems.findById(item.getId());
  }
  mediaFilter(item) {
    if (this.isSelected(item)) {
      return true;
    }
    return this.filterIncludeFunctions.every((func) => {
      return func(item);
    });
  }

  showSecondaryGroupFiles(visible) {
    this.showAllGroupFiles = visible;
    this.groupFilterItems.filter();
  }
  hideSecondaryGroupFiles() {
    this.showAllGroupFiles = false;
    this.groupFilterItems.filter();
  }
  primaryFileFilter(item) {
    return this.showAllGroupFiles || item.isPrimary();
  }

  step() {
    log.debug("files ", this.files.getLength());
  }
  async loadItems() {
    await runSerial(
      this.loadItemsFromDatabase.bind(this),
      this.createGroups.bind(this),
      this.setupTags.bind(this),
      this.setupAlbums.bind(this)
    );
    runSerial(
      this.loadItemsFromAPI.bind(this),
      this.createGroups.bind(this),
      this.setupTags.bind(this),
      this.setupAlbums.bind(this)
    );
  }

  createGroups() {
    this.groups.clear();
    var primary = this.files.search((f) => {
      return f.isInGroup() && f.isPrimary();
    });
    var groupMap = {};
    for (var f of primary) {
      var group = new FileGroup(f);
      this.groups.insert(group);
      groupMap[f.getId()] = group;
    }
    for (var s of this.files) {
      if (s.isGroupSecondary()) {
        var g = groupMap[s.fileSetPrimaryId];
        g.addFile(s);
      }
    }
  }

  getTagMap() {
    return [...this.tags].reduce((map, tag) => {
      map[tag.getId()] = tag;
      return map;
    }, {});
  }

  getFileMap() {
    return [...this.files].reduce((map, file) => {
      map[file.getId()] = file;
      return map;
    }, {});
  }
  setupTags() {
    var tagMap = this.getTagMap();
    var fileMap = this.getFileMap();
    for (var fileTags of this.mediaTags) {
      var file = fileMap[fileTags.getMediaFileId()];
      if (file == null) {
        log.error("file not found for tag ", fileTags.getId());
      } else {
        const tags = fileTags.getTagIds().map((id) => {
          return tagMap[id];
        });
        file.setTags(tags);
        tags.forEach((t) => {
          t.addFile(file);
        });
      }
    }
    FilterChangeEvent.emit();
  }

  getAlbumMap() {
    return [...this.albums].reduce((map, album) => {
      map[album.getId()] = album;
      return map;
    }, {});
  }
  setupAlbums() {
    var albumMap = this.getAlbumMap();
    var fileMap = this.getFileMap();
    for (var fileAlbum of this.mediaAlbums) {
      var file = fileMap[fileAlbum.getMediaFileId()];
      if (file == null) {
        log.error("file not found for album ", fileAlbum.getId());
      } else {
        const albums = fileAlbum.getAlbumIds().map((id) => {
          return albumMap[id];
        });
        file.setAlbums(albums);
        albums.forEach((t) => {
          t.addFile(file);
        });
      }
    }
    FilterChangeEvent.emit();
  }

  async updateDatabaseItems() {
    log.never("updateDatabaseItems");
    var updates = [...this.files].filter((f) => {
      return f.isChanged();
    });
    log.never("\tcount=", updates.length);
    await dbSaveMediaFiles(updates);
    await API.saveMediaFiles(updates);
    for (var update of updates) {
      update.unsetChanged();
    }
  }

  async loadItemsFromDatabase() {
    try {
      return await runSerial(
        dataLoader(dbGetMediaFiles, dataAdder(this.files, MediaFile), 10000)
      );
    } catch (ex) {
      log.error(ex, "failed to get items");
    }
  }

  async loadItemsFromAPI() {
    try {
      //await dataLoader(getMediaFiles, dataUpdater(this.files, MediaFile))();
      // don't await.  UI works from indexedDB until load is finished
      return runParallel(
        dataLoader(API.getMediaFiles, dataUpdater(this.files, MediaFile)),
        dataLoader(API.getTags, dataUpdater(this.tags, Tag)),
        dataLoader(API.getMediaTags, dataUpdater(this.mediaTags, MediaTag)),
        dataLoader(
          API.getMediaAlbums,
          dataUpdater(this.mediaAlbums, MediaAlbum)
        ),
        dataLoader(API.getProperties, dataUpdater(this.properties, Property)),
        dataLoader(
          API.getPropertyValues,
          dataUpdater(this.propertyValues, PropertyValue)
        ),
        dataLoader(API.getAlbums, dataUpdater(this.albums, Album))
      );
    } catch (ex) {
      log.error(ex, "failed to get items");
    }
  }

  getVisibleItems() {
    log.never("return visibleItems ");
    return this.visibleItems;
  }

  getAllFiles() {
    log.never("return all items ");
    return this.files;
  }

  getSelectedItems() {
    return this.selectedItems;
  }

  setSearchText(text) {
    var lcText = text.toLowerCase();
    var num = Number.parseInt(lcText);
    this.searchFilterItems.setKeepFunction((item) => {
      var nameMatch = item.getName().toLowerCase().includes(lcText);
      if (nameMatch) {
        return true;
      }
      var idMatch = id.Id == num;
      if (idMatch) {
        return true;
      }
    });
  }

  setDateFilter(start, end) {
    var starttime = start ? start.getTime() : null;
    var endtime = end ? end.getTime() : null;
    this.dateFilterItems.setKeepFunction((item) => {
      return (
        (starttime == null || item.getDateTaken().getTime() >= starttime) &&
        (endtime == null || item.getDateTaken().getTime() <= endtime)
      );
    });
  }
  setSortType(type) {
    type = type.toLowerCase();
    if (type == "id") {
      this.sortedItems.setSortComparison(compareIds);
    } else if (type == "date") {
      this.sortedItems.setSortComparison(compareDates);
    } else {
      this.sortedItems.setSortComparison(compareNames);
    }
  }

  selectItem(item) {
    var index = this.visibleItems.indexOf(item);
    log.debug("inserting index ", index);
    this.selectedItems.clear();
    if (item == null) {
      log.error("selecting null item");
      return;
    }
    this.selectedItems.insertOnce(item);
    this.lastSelect = item;
    this.setFocus(item);
  }

  addSelectItem(item) {
    if (item == null) {
      log.error("selecting null item");
      return;
    }
    this.selectedItems.insertOnce(item);
    this.lastSelect = item;
  }
  toggleSelectItem(item) {
    if (item == null) {
      log.error("selecting null item");
      return;
    }
    if (this.selectedItems.indexOf(item) != null) {
      this.selectedItems.remove(item);
    } else {
      this.selectedItems.insertOnce(item);
    }
    this.lastSelect = item;
  }

  selectToItem(item) {
    if (this.lastSelect == null) {
      this.selectItem(item);
    }
    var visible = this.getVisibleItems();
    var idx1 = visible.indexOf(item);
    var idx2 = visible.indexOf(this.lastSelect);
    if (idx2 == null) {
      return this.selectItem(item);
    }
    log.debug(`select items ${idx1}-${idx2}`);
    var start = Math.min(idx1, idx2);
    var end = Math.max(idx1, idx2);

    for (var i = start; i <= end; i++) {
      // todo: an event is emitted each insert.  add a bulk insert so only 1 event results
      this.selectedItems.insertOnce(visible.getItemAt(i));
    }
    this.lastSelect = item;
    this.setFocus(item);
  }

  async ungroup(file, saveChange = true) {
    if (file.getGroup()) {
      file.getGroup().removeFile(file);
    }
    if (saveChange) {
      await this.updateDatabaseItems();
      this.groupFilterItems.filter();
    }
  }

  async groupSelectedItems(primary) {
    var groupFiles = new ObservableArray([...this.selectedItems]);
    for (var old of this.selectedItems) {
      if (old.isInGroup()) {
        for (var newSel of old.getGroup().getFiles()) {
          groupFiles.insertOnce(newSel);
        }
      }
      this.ungroup(old, false);
    }
    var group = new FileGroup();
    group.setPrimaryFile(primary);
    for (var item of groupFiles) {
      group.addFile(item);
    }
    this.groups.insert(group);
    this.groups.removeMatch((group) => {
      return group.getFiles().getLength() == 0;
    });
    await this.updateDatabaseItems();
    // todo: send to server with API
    this.groupFilterItems.filter();
  }

  getTagById(id) {
    return this.tags.findById(id);
  }
  getTags() {
    return this.tags;
  }

  async createTag(parent, newTag) {
    var parentId = parent;
    if (parent != null && typeof parent == "object") {
      parentId = parent.getId();
    }
    var parts = newTag.split("/").map((n) => {
      return n.trim();
    });
    var leaf = parts.splice(-1)[0]; // remove last element (leaf tag name)
    var walk = null;
    for (var next of parts) {
      var child = this.tags.getChildByName(parentId, next);
      if (child == null) {
        child = await this.createTag(walk, next);
      }
      walk = child;
      parentId = child.getId();
    }

    var created = await API.createTag(parentId, leaf);
    this.tags.insert(created);
    return created;
  }

  async updateTag(id, name, parentId, hidden = false) {
    var tag = this.tags.findById(id);
    if (tag == null) {
      log.error("cannot find tag ", id);
      return null;
    }
    tag.Name = name;
    tag.ParentId = parentId;
    tag.Hidden = hidden;
    var updated = await API.updateTag(tag);
    if (tag.hidden) {
      this.tags.remove(tag);
    }
    FilterChangeEvent.emit();
    return updated;
  }

  async tagAddFile(tag, file) {
    var result = await API.addMediaTag(file.getId(), tag.getId());
    file.addTag(tag);
    tag.addFile(file);
    FocusChangeEvent.emit(this.focus);
    return result;
  }
  async tagRemoveFile(tag, file) {
    var result = await API.removeMediaTag(file.getId(), tag.getId());
    file.removeTag(tag);
    tag.removeFile(file);
    FocusChangeEvent.emit(this.focus);
    return result;
  }

  async tagSelected(tagId) {
    var tag = this.tags.findById(tagId);
    if (tag == null) {
      log.error("unkown tag", tagId);
      return;
    }
    for (var sel of this.selectedItems) {
      var file = this.files.findById(sel.getId());
      if (file == null) {
        log.error("unknown file ", sel.getId());
      } else {
        if (await API.addMediaTag(sel.getId(), tagId)) {
          file.addTag(tag);
          tag.addFile(file);
        }
      }
    }
  }

  async untagSelected(tagId) {
    var tag = this.tags.findById(tagId);
    if (tag == null) {
      log.error("unkown tag", tagId);
      return;
    }
    for (var sel of this.selectedItems) {
      var file = this.files.findById(sel.getId());
      if (file == null) {
        log.error("unknown file ", sel.getId());
      } else {
        if (await API.removeMediaTag(sel.getId(), tagId)) {
          file.removeTag(tag);
          tag.removeFile(file);
        }
      }
    }
  }

  getTagPath(tag) {
    if (tag == null) {
      return "";
    }
    var tags = this.getTags();
    if (typeof tag == "number") {
      tag = tags.findById(tag);
    }
    if (tag == null) {
      return "--";
    }
    var path = "/" + tag.getName();
    var parent = tags.findById(tag.getParentId());
    if (parent != null) {
      path = this.getTagPath(parent) + path;
    }
    return path;
  }

  getAlbumById(id) {
    return this.albums.findById(id);
  }
  getAlbums() {
    return this.albums;
  }

  async createAlbum(name, description = null) {
    var album = await API.createAlbum(name, description);
    if (album != null) {
      this.albums.insertOnce(album);
    }
    return album;
  }

  async albumAddFile(album, file) {
    var result = await API.addMediaAlbum(file.getId(), album.getId());
    file.addAlbum(album);
    album.addFile(file);
    FocusChangeEvent.emit(this.focus);
    return result;
  }
  async albumRemoveFile(album, file) {
    var result = await API.removeMediaAlbum(file.getId(), album.getId());
    file.removeAlbum(album);
    album.removeFile(file);
    FocusChangeEvent.emit(this.focus);
    return result;
  }

  async albumAddSelected(albumId) {
    var album = this.albums.findById(albumId);
    if (album == null) {
      log.error("unkown album", albumId);
      return;
    }
    for (var sel of this.selectedItems) {
      var file = this.files.findById(sel.getId());
      if (file == null) {
        log.error("unknown file ", sel.getId());
      } else {
        if (await API.addMediaAlbum(sel.getId(), albumId)) {
          file.addAlbum(album);
          album.addFile(file);
        }
      }
    }
  }

  async albumRemoveSelected(albumId) {
    var album = this.albums.findById(albumId);
    if (album == null) {
      log.error("unkown album", albumId);
      return;
    }
    for (var sel of this.selectedItems) {
      var file = this.files.findById(sel.getId());
      if (file == null) {
        log.error("unknown file ", sel.getId());
      } else {
        if (await API.removeMediaAlbum(sel.getId(), albumId)) {
          file.removeAlbum(album);
          album.removeFile(file);
        }
      }
    }
  }
}

const media = new Media();

export { media };

export default media;
