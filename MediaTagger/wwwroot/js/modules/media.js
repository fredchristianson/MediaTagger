import { LOG_LEVEL, Logger } from '../../drjs/logger.js';
import {
  compareDates,
  compareIds,
  compareNames,
  randomizeItems,
  seedRandom
} from '../data/helpers.js';
import {
  Tag,
  MediaTag,
  Property,
  PropertyValue,
  MediaFile,
  Album,
  MediaAlbum,
  EntityChangeEvent
} from '../data/items.js';
import { runParallel, runSerial } from './task.js';
import { dataAdder, dataLoader, dataUpdater } from '../data/data-loader.js';
import {
  ObservableView,
  SortedObservableView,
  FilteredObservableView,
  ObservableArray,
  ObservableTree
} from './collections.js';
import * as API from './mt-api.js';
import { dbGetMediaFiles, dbSaveMediaFiles } from '../data/database.js';
import {
  Listeners,
  BuildCustomEventHandler,
  EventEmitter,
  ObjectEventType
} from '../../drjs/browser/event.js';
import FileGroup from '../data/file-group.js';

const log = Logger.create('Media', LOG_LEVEL.DEBUG);

export const FilterChangeEventType = new ObjectEventType('FilterChange');
export const FilterChangeEvent = new EventEmitter(FilterChangeEventType);

export const FocusChangeEventType = new ObjectEventType('FocusChange');
export const FocusChangeEvent = new EventEmitter(FocusChangeEventType);

export const FocusEntityChangeEventType = new ObjectEventType(
  'FocusEntityChange'
);
export const FocusEntityChangeEvent = new EventEmitter(
  FocusEntityChangeEventType
);

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
    this.focusIndex = 0;
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
    // lastSelect may be toggled off
    this.lastSelect = null;
    this.focusItem = null;
    this.previousFocus = null;

    this.listeners = new Listeners(
      BuildCustomEventHandler()
        .emitter(this.files.updatedEvent)
        .onEvent(this, this.updateDatabaseItems)
        .build(),

      BuildCustomEventHandler()
        .emitter(FilterChangeEvent)
        .onEvent(this, this.onFilterChanged)
        .build(),
      BuildCustomEventHandler()
        .emitter(EntityChangeEvent)
        .onEvent(this, this.onEntityChanged)
        .build(),
      BuildCustomEventHandler()
        .emitter(this.visibleItems.getUpdatedEvent())
        .onEvent(this, this.onVisibleItemsChange)
        .build()
    );
    this.filterIncludeFunctions = [];
  }

  onEntityChanged(entity) {
    if (entity === this.focusItem) {
      FocusEntityChangeEvent.emit(entity);
    }
  }

  onVisibleItemsChange() {
    log.never('media onVisibleItemChange');
    const focus = this.visibleItems.getItemAt(this.focusIndex);
    if (focus == null) {
      this.focusIndex = 0;
      this.focusItem = this.visibleItems.getItemAt(0);
    } else if (focus != this.focusItem) {
      this.setFocus(focus);
    }
  }
  getFocusChangeEvent() {
    return FocusChangeEvent;
  }

  clearSelection() {
    this.clearFocus();
    this.selectedItems.clear();
  }
  clearFocus() {
    if (this.focusItem != null) {
      this.previousFocus = this.focusItem;
    }
    this.focusItem = null;
    this.focusIndex = null;

    FocusChangeEvent.emit(null);
  }
  getFocus() {
    return this.focusItem;
  }
  getFocusIndex() {
    return this.focusIndex;
  }
  getLastFocusIndex() {
    return this.focusIndex ?? this.visibleItems.indexOf(this.previousFocus);
  }

  moveFocus(focusIndexOffset) {
    let newIndex = Math.max(0, this.focusIndex + focusIndexOffset);
    newIndex = Math.min(newIndex, this.visibleItems.Length - 1);
    this.focusItem = this.visibleItems.getItemAt(newIndex);
    this.focusIndex = newIndex;
    FocusChangeEvent.emitNow(this.focusItem);
  }
  setFocus(item) {
    if (item == this.focusItem) {
      return;
    }
    if (this.focusItem != null) {
      this.previousFocus = this.focusItem;
    }
    this.focusItem = item;
    this.focusIndex = this.visibleItems.indexOf(item);
    FocusChangeEvent.emitNow(item);
  }

  getLastFocus() {
    return this.focusItem ?? this.previousFocus;
  }

  // updateFocus happens when the item doesn't change, but an attribute does (e.g. rotation)
  async updateFocus() {
    await this.updateDatabaseItems();
    FocusChangeEvent.emitNow(this.focus);
  }

  clearFilter() {
    this.filterIncludeFunctions = [];
    FilterChangeEvent.emitNow();
  }

  addFilter(func) {
    this.filterIncludeFunctions.push(func);
    FilterChangeEvent.emitNow();
  }

  onFilterChanged() {
    log.info('media filter changed');
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
    log.debug('files ', this.files.getLength());
  }
  async loadItems() {
    /*
     * await runSerial(
     *   this.loadItemsFromDatabase.bind(this),
     *   this.createGroups.bind(this),
     *   this.setupTags.bind(this),
     *   this.setupAlbums.bind(this)
     * );
     */
    runSerial(
      this.loadItemsFromAPI.bind(this),
      this.createGroups.bind(this),
      this.setupTags.bind(this),
      this.setupAlbums.bind(this)
    );
  }

  createGroups() {
    this.groups.clear();
    const primary = this.files.search((f) => {
      return f.isInGroup() && f.isPrimary();
    });
    const groupMap = {};
    for (const f of primary) {
      const group = new FileGroup(f);
      this.groups.insert(group);
      groupMap[f.getId()] = group;
    }
    for (const s of this.files) {
      if (s.isGroupSecondary()) {
        const g = groupMap[s.fileSetPrimaryId];
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
    const tagMap = this.getTagMap();
    const fileMap = this.getFileMap();
    for (const fileTags of this.mediaTags) {
      const file = fileMap[fileTags.getMediaFileId()];
      if (file == null) {
        log.error('file not found for tag ', fileTags.getId());
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
    FilterChangeEvent.emitNow();
  }

  getAlbumMap() {
    return [...this.albums].reduce((map, album) => {
      map[album.getId()] = album;
      return map;
    }, {});
  }
  setupAlbums() {
    const albumMap = this.getAlbumMap();
    const fileMap = this.getFileMap();
    for (const fileAlbum of this.mediaAlbums) {
      const file = fileMap[fileAlbum.getMediaFileId()];
      if (file == null) {
        log.error('file not found for album ', fileAlbum.getId());
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
    FilterChangeEvent.emitNow();
  }

  async updateDatabaseItems() {
    log.never('updateDatabaseItems');
    const updates = [...this.files].filter((f) => {
      return f.isChanged();
    });
    log.never('\tcount=', updates.length);
    await dbSaveMediaFiles(updates);
    await API.saveMediaFiles(updates);
    for (const update of updates) {
      update.unsetChanged();
    }
  }

  async loadItemsFromDatabase() {
    try {
      return await runSerial(
        dataLoader(dbGetMediaFiles, dataAdder(this.files, MediaFile), 10000)
      );
    } catch (ex) {
      log.error(ex, 'failed to get items');
      return null;
    }
  }

  async loadItemsFromAPI() {
    try {
      /*
       * await dataLoader(getMediaFiles, dataUpdater(this.files, MediaFile))();
       *  don't await.  UI works from indexedDB until load is finished
       */
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
      log.error(ex, 'failed to get items');
      return null;
    }
  }

  getVisibleItems() {
    log.never('return visibleItems ');
    return this.visibleItems;
  }

  getAllFiles() {
    log.never('return all items ');
    return this.files;
  }

  getSelectedItems() {
    return this.selectedItems;
  }

  setSearchText(text) {
    const lcText = text.toLowerCase();
    const num = Number.parseInt(lcText);
    this.searchFilterItems.setKeepFunction((item) => {
      const nameMatch = item.getName().toLowerCase().includes(lcText);
      if (nameMatch) {
        return true;
      }
      const idMatch = id.Id == num;
      if (idMatch) {
        return true;
      }
      return false;
    });
  }

  setDateFilter(start, end) {
    const starttime = start ? start.getTime() : null;
    const endtime = end ? end.getTime() : null;
    this.dateFilterItems.setKeepFunction((item) => {
      return (
        (starttime == null || item.getDateTaken().getTime() >= starttime) &&
        (endtime == null || item.getDateTaken().getTime() <= endtime)
      );
    });
  }
  setSortType(sortType) {
    const type = sortType.toLowerCase();
    if (type == 'id') {
      this.sortedItems.setSortComparison(compareIds);
    } else if (type == 'date') {
      this.sortedItems.setSortComparison(compareDates);
    } else if (type == 'random') {
      seedRandom();
      this.sortedItems.setSortComparison(randomizeItems);
    } else {
      this.sortedItems.setSortComparison(compareNames);
    }
  }

  selectItem(item) {
    const index = this.visibleItems.indexOf(item);
    log.debug('inserting index ', index);
    this.selectedItems.clear();
    if (item == null) {
      log.error('selecting null item');
      return;
    }
    this.selectedItems.insertOnce(item);
    this.lastSelect = item;
    this.setFocus(item);
  }

  addSelectItem(item) {
    if (item == null) {
      log.error('selecting null item');
      return;
    }
    this.selectedItems.insertOnce(item);
    this.lastSelect = item;
  }
  toggleSelectItem(item) {
    if (item == null) {
      log.error('selecting null item');
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
    const visible = this.getVisibleItems();
    const idx1 = visible.indexOf(item);
    const idx2 = visible.indexOf(this.lastSelect);
    if (idx2 == null) {
      return this.selectItem(item);
    }
    log.debug(`select items ${idx1}-${idx2}`);
    const start = Math.min(idx1, idx2);
    const end = Math.max(idx1, idx2);

    for (let i = start; i <= end; i++) {
      // todo: an event is emitted each insert.  add a bulk insert so only 1 event results
      this.selectedItems.insertOnce(visible.getItemAt(i));
    }
    this.lastSelect = item;
    this.setFocus(item);
    return item;
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
    const groupFiles = new ObservableArray([...this.selectedItems]);
    for (const old of this.selectedItems) {
      if (old.isInGroup()) {
        for (const newSel of old.getGroup().getFiles()) {
          groupFiles.insertOnce(newSel);
        }
      }
      this.ungroup(old, false);
    }
    const group = new FileGroup();
    group.setPrimaryFile(primary);
    for (const item of groupFiles) {
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
    let parentId = parent;
    if (parent != null && typeof parent == 'object') {
      parentId = parent.getId();
    }
    const parts = newTag.split('/').map((n) => {
      return n.trim();
    });
    // remove last element (leaf tag name)
    const leaf = parts.splice(-1)[0];
    let walk = null;
    for (const next of parts) {
      let child = this.tags.getChildByName(parentId, next);
      if (child == null) {
        // eslint-disable-next-line no-await-in-loop
        child = await this.createTag(walk, next);
      }
      walk = child;
      parentId = child.getId();
    }

    const created = await API.createTag(parentId, leaf);
    this.tags.insert(created);
    return created;
  }

  async updateTag(id, name, parentId, hidden = false) {
    const tag = this.tags.findById(id);
    if (tag == null) {
      log.error('cannot find tag ', id);
      return null;
    }
    tag.Name = name;
    tag.ParentId = parentId;
    tag.Hidden = hidden;
    const updated = await API.updateTag(tag);
    if (tag.hidden) {
      this.tags.remove(tag);
    }
    FilterChangeEvent.emitNow();
    return updated;
  }

  async tagAddFile(tag, file) {
    const result = await API.addMediaTag(file.getId(), tag.getId());
    file.addTag(tag);
    tag.addFile(file);
    FocusChangeEvent.emitNow(this.focus);
    return result;
  }
  async tagRemoveFile(tag, file) {
    const result = await API.removeMediaTag(file.getId(), tag.getId());
    file.removeTag(tag);
    tag.removeFile(file);
    FocusChangeEvent.emitNow(this.focus);
    return result;
  }

  async tagSelected(tagId) {
    const tag = this.tags.findById(tagId);
    if (tag == null) {
      log.error('unkown tag', tagId);
      return;
    }
    for (const sel of this.selectedItems) {
      const file = this.files.findById(sel.getId());
      if (file == null) {
        log.error('unknown file ', sel.getId());
        // eslint-disable-next-line no-await-in-loop
      } else if (await API.addMediaTag(sel.getId(), tagId)) {
        file.addTag(tag);
        tag.addFile(file);
      }
    }
  }

  async untagSelected(tagId) {
    const tag = this.tags.findById(tagId);
    if (tag == null) {
      log.error('unkown tag', tagId);
      return;
    }
    for (const sel of this.selectedItems) {
      const file = this.files.findById(sel.getId());
      if (file == null) {
        log.error('unknown file ', sel.getId());
        // eslint-disable-next-line no-await-in-loop
      } else if (await API.removeMediaTag(sel.getId(), tagId)) {
        file.removeTag(tag);
        tag.removeFile(file);
      }
    }
  }

  getTagPath(tag) {
    if (tag == null) {
      return '';
    }
    const tags = this.getTags();
    if (typeof tag == 'number') {
      // eslint-disable-next-line no-param-reassign
      tag = tags.findById(tag);
    }
    if (tag == null) {
      return '--';
    }
    let path = tag.getName();
    const parent = tags.findById(tag.getParentId());
    if (parent != null) {
      path = `${this.getTagPath(parent)}/${path}`;
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
    const album = await API.createAlbum(name, description);
    if (album != null) {
      this.albums.insertOnce(album);
    }
    return album;
  }

  async albumAddFile(album, file) {
    const result = await API.addMediaAlbum(file.getId(), album.getId());
    file.addAlbum(album);
    album.addFile(file);
    FocusChangeEvent.emitNow(this.focus);
    return result;
  }
  async albumRemoveFile(album, file) {
    const result = await API.removeMediaAlbum(file.getId(), album.getId());
    file.removeAlbum(album);
    album.removeFile(file);
    FocusChangeEvent.emitNow(this.focus);
    return result;
  }

  async albumAddSelected(albumId) {
    const album = this.albums.findById(albumId);
    if (album == null) {
      log.error('unkown album', albumId);
      return;
    }
    for (const sel of this.selectedItems) {
      const file = this.files.findById(sel.getId());
      if (file == null) {
        log.error('unknown file ', sel.getId());
        // eslint-disable-next-line no-await-in-loop
      } else if (await API.addMediaAlbum(sel.getId(), albumId)) {
        file.addAlbum(album);
        album.addFile(file);
      }
    }
  }

  async albumRemoveSelected(albumId) {
    const album = this.albums.findById(albumId);
    if (album == null) {
      log.error('unkown album', albumId);
      return;
    }
    for (const sel of this.selectedItems) {
      const file = this.files.findById(sel.getId());
      if (file == null) {
        log.error('unknown file ', sel.getId());
        // eslint-disable-next-line no-await-in-loop
      } else if (await API.removeMediaAlbum(sel.getId(), albumId)) {
        file.removeAlbum(album);
        album.removeFile(file);
      }
    }
  }

  async rotateCCW() {
    log.debug('rotateCCW');
  }
  async rotateCW() {
    log.debug('rotateCW');
  }
  async rotate180() {
    log.debug('rotate180');
  }
}

const media = new Media();

export { media };
