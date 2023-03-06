import { ComponentBase } from '../../drjs/browser/component.js';
import { Settings } from '../modules/settings.js';
import { media, FocusChangeEvent } from '../modules/media.js';
import { RightGridSizer } from '../modules/drag-drop.js';
import {
  Listeners,
  BuildClickHandler,
  Continuation,
  BuildCheckboxHandler,
  BuildHoverHandler,
  BuildKeyHandler,
  BuildCustomEventHandler,
  Key,
  BuildInputHandler
} from '../../drjs/browser/event.js';
import { LOG_LEVEL, Logger } from '../../drjs/logger.js';
import {
  HtmlTemplate,
  DataValue,
  InputValue,
  HtmlValue
} from '../../drjs/browser/html-template.js';
import { OnNextLoop } from '../../drjs/browser/timer.js';
import {
  SearchWord,
  SearchLevel,
  SearchPhrase
} from '../modules/tag-search.js';
import { Assert } from '../../drjs/assert.js';
import { FocusView } from '../controls/focus-view.js';
const log = Logger.create('QuickTags', LOG_LEVEL.DEBUG);

function stopBrowserClose(event) {
  // Cancel the event as stated by the standard.
  event.preventDefault();
  // Chrome requires returnValue to be set.
  event.returnValue = '';
}

export class QuickTagsComponent extends ComponentBase {
  constructor(selector, htmlName = 'quick-tags') {
    super(selector, htmlName);
    this.listeners = new Listeners();
    this.dropHandler = null;
  }

  onDetach() {
    this.listeners.removeAll();
    window.removeEventListener('beforeunload', stopBrowserClose, true);
  }

  async onHtmlInserted(_parent) {
    //window.addEventListener("beforeunload", stopBrowserClose, true);
    this.settings = await Settings.load('quick-tags');
    this.tags = media.getTags();
    this.hotkeys = this.settings.get('hotkeys', {});
    this.searchText = '';
    this.searchCursorPosition = 0;
    this.searchPhrase = new SearchPhrase();
    this.focusView = new FocusView(this, '.images');
    this.searchInput = this.dom.first('input.tag-search');
    this.nodeTemplate = new HtmlTemplate(
      this.dom.first('.quick-tag-tree-node-template')
    );
    this.keyTemplate = new HtmlTemplate(
      this.dom.first(this.dom.first('.quick-tag-key-template'))
    );

    this.dom.check('[name="untagged"]');
    this.untaggedOnly = true;
    this.recent = [];

    this.sizerSizer = new RightGridSizer(
      '.grid-sizer.quick-tags-sizer',
      '#quick-tags .media'
    );

    this.listeners.add(
      BuildInputHandler()
        .listenTo(this.searchInput)
        .onInput(this, this.searchChange)
        .build(),
      BuildCheckboxHandler()
        .listenTo(this.dom, "[name='untagged']")
        .setData(this, this.getNodeTag)
        .onChecked(this, this.filterUntaggedOnly)
        .onUnchecked(this, this.filterAllFiles)
        .build(),

      BuildHoverHandler()
        .listenTo(this.dom, '.quick-tag-tree .self')
        .onStart(this, this.hoverStart)
        .onEnd(this, this.hoverEnd)
        .build(),
      BuildHoverHandler()
        .listenTo(this.dom, '.hotkey .input.active')
        .onStart(this, this.hotkeyHover)
        .onEnd(this, this.hotkeyHoverEnd)
        .build(),
      BuildKeyHandler()
        .setDefaultContinuation(Continuation.Continue)
        /*
         * .filterAllow((event) => {
         *   let active = document.activeElement;
         *   log.debug("filter ", active, active?.tagName);
         *   return active == null || active.tagName != "INPUT";
         * })
         */
        .onKey('Backspace', this, this.keyPress)
        .onKey('ArrowRight', this, this.nextImage)
        .onKey(Key('='), this, this.nextImage)
        .onKey('ArrowLeft', this, this.previousImage)
        .onKey(Key('-'), this, this.previousImage)
        .onKey('[', media, media.rotateCCW)
        .onKey(']', media, media.rotateCW)
        .onKey('\\', media, media.rotate180)
        .onKey(Key('c').withCtrl(), this, this.copy)
        .onKey(Key('v').withCtrl(), this, this.paste)
        .onKey(Key('y').withCtrl(), this, this.repeat)
        .onKey(Key.Escape, this, this.resetSearch)
        .onKey(Key.Tab.withoutShift(), this, this.nextTag)
        .onKey(Key.Tab.withShift(), this, this.prevTag)
        .onKey(Key.Enter, this, this.toggleTagSelect)
        .onKey(Key.Regex(/[0-9]/).withCtrl(), this, this.selectRecent)
        .onKey(Key.Regex(/[a-z]/).withAlt(), this, this.selectHotkey)
        .onKey(
          Key.Regex(/[a-zA-Z0-9\/\s]/)
            .withoutAlt()
            .withoutCtrl(),
          this,
          this.keyPress
        )
        .build(),

      BuildClickHandler()
        .setDefaultContinuation(Continuation.StopAll)
        .listenTo(this.dom, '.create-tag')
        .onClick(this, this.onCreateTag)
        .build(),
      BuildCustomEventHandler()
        .emitter(media.getVisibleItems().getUpdatedEvent())
        .onEvent(this, this.onFileChange)
        .build(),
      BuildCheckboxHandler()
        .listenTo('.quick-tag-tree', 'input[type="checkbox"]')
        .setData(this, this.getTagForElement)
        .onChecked(this, this.selectTag)
        .onUnchecked(this, this.unselectTag)
        .build(),
      BuildCustomEventHandler()
        .emitter(FocusChangeEvent)
        .onEvent(this, this.onFocusChange)
        .build()
    );
    media.clearFilter();
    media.addFilter(this.filterItem.bind(this));
    this.visibleItems = media.getVisibleItems();

    this.createTags();
    this.focusIndex = 0;
  }

  onFocusChange() {
    this.fillTree();
  }
  async selectRecent(key) {
    log.debug('recent ', key);
    const tag = this.recent[key];
    const focus = media.getFocus();
    if (tag != null && focus != null) {
      if (focus.hasTag(tag)) {
        await this.unselectTag(tag);
      } else {
        await this.selectTag(tag);
      }

      return Continuation.StopAll;
    }
    return null;
  }

  async selectHotkey(key, target, event) {
    event.preventDefault();
    log.debug('hotkey ', key);
    const tag = this.getTagForHotkey(key);
    const focus = media.getFocus();
    if (tag != null && focus != null) {
      if (focus.hasTag(tag)) {
        await this.unselectTag(tag);
      } else {
        await this.selectTag(tag);
      }

      return Continuation.StopAll;
    }
    return null;
  }

  getTagForElement(element) {
    const id = this.dom.getDataWithParent(element, 'id');
    return media.getTagById(id);
  }

  async addRecent(tag) {
    if (this.recent.includes(tag)) {
      return;
    }
    while (this.recent.length > 9) {
      this.recent.shift();
    }
    this.recent.push(tag);
    this.fillRecentTags();
  }
  async selectTag(tag) {
    log.debug('select tag ', tag);
    const focus = media.getFocus();
    if (focus && !focus.hasTag(tag)) {
      await media.tagAddFile(tag, focus);
      this.resetSearch();
      this.addRecent(tag);
    }
  }

  async unselectTag(tag) {
    log.debug('unselect tag ', tag);
    const focus = media.getFocus();
    if (focus && focus.hasTag(tag)) {
      await media.tagRemoveFile(tag, focus);
      this.resetSearch();
    }
  }

  nextImage() {
    // save current tags to quickly tag next image
    const focus = media.getFocus();
    this.previousTags = focus?.Tags;
    media.moveFocus(1);
    return Continuation.PreventDefault;
  }

  previousImage() {
    media.moveFocus(-1);
    return Continuation.PreventDefault;
  }

  checkTagTree(image) {
    const tree = this.dom.first('.quick-tag-tree');
    const tags = this.dom.find(
      tree,
      ".tag.node > .self input[type='checkbox']"
    );
    for (const tagElement of tags) {
      const tag = this.getTagForElement(tagElement);
      if (tag) {
        // don't use this.dom to check.  it sends event we don't want
        tagElement.checked = image.hasTag(tag);
      }
    }
  }

  async rotateCW() {
    const focus = media.getFocus();
    if (focus) {
      focus.rotate(90);
      await media.updateDatabaseItems();
    }
  }

  async rotateCCW() {
    const focus = media.getFocus();
    if (focus) {
      focus.rotate(-90);
      await media.updateDatabaseItems();
    }
  }

  getNodeTag(target, _event) {
    const id = this.dom.getDataWithParent(target, 'id');
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
  }
  filterItem(item) {
    if (!item.isBrowserImg()) {
      return false;
    }
    if (!this.untaggedOnly) {
      return true;
    }
    return item.Tags.length == 0;
  }

  setHotkey(tag, key) {
    Object.keys(this.hotkeys).forEach((oldKey) => {
      const oldTagId = this.hotkeys[oldKey];
      if (oldTagId == (tag?.Id ?? -1)) {
        delete this.hotkeys[oldKey];
      }
    });

    const oldHotkey = this.getTagForHotkey(key ?? '');
    if (oldHotkey != key) {
      this.hotkeys[key] = tag.Id;
      this.settings.set('hotkeys', this.hotkeys);
    }
  }

  getRecentForTag(tagId) {
    let searchId = tagId;
    if (typeof tagId == 'object') {
      searchId = tagId.Id;
    }
    for (const rtag of this.recent) {
      if (rtag.Id == searchId) {
        return rtag;
      }
    }
    return null;
  }

  getHotkeyForTag(tagId) {
    let searchId = tagId;
    if (typeof tagId == 'object') {
      searchId = tagId.Id;
    }
    for (const key of Object.keys(this.hotkeys)) {
      const hotkeyTagId = this.hotkeys[key];
      if (hotkeyTagId == searchId) {
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

  createTags() {
    this.fillTree();
    this.fillRecentTags();
    this.fillHotkeys();
  }

  fillRecentTags() {
    const recent = this.dom.first('.recent');
    this.dom.removeChildren(recent);
    if (this.recent.length == 0) {
      const noItems = this.dom.createElement('div', {
        '@class': 'no-items',
        html: 'no recent items'
      });
      this.dom.append(recent, noItems);
    }
    for (let idx = 0; idx < 10; idx++) {
      const tag = this.recent[idx];
      if (tag != null) {
        const row = this.keyTemplate.fill({
          '.ctrl-key': idx,
          '.tag-name': [
            new DataValue('id', tag.Id),
            new HtmlValue(media.getTagPath(tag))
          ]
        });
        this.dom.append(recent, row);
      }
    }
  }

  fillHotkeys() {
    const hotkeys = this.dom.first('.keys');
    this.dom.removeChildren(hotkeys);
    for (const key of Object.keys(this.hotkeys).sort()) {
      const tag = this.hotkeys[key];
      if (tag != null) {
        const row = this.keyTemplate.fill({
          '.ctrl-key': key,
          '.tag-name': [
            new DataValue('id', tag.Id),
            new HtmlValue(media.getTagPath(tag))
          ]
        });
        this.dom.append(hotkeys, row);
      }
    }

    const treeKeys = this.dom.find('.tag.node .hotkey .key');
    for (const key of treeKeys) {
      const id = this.dom.getDataWithParent(key, 'id');
      const k = this.getHotkeyForTag(id);
      this.dom.setInnerHTML(key, k);
    }
  }

  fillTree() {
    this.tags = media.getTags();

    const scroll = this.dom.first('.quick-tag-tree');
    const scrollTop = scroll.scrollTop;
    const top = this.tags.search((tag) => {
      return tag.ParentId == null;
    });
    const parent = this.dom.first('.quick-tag-tree .tags');
    this.dom.removeChildren(parent);

    this.insertTags(parent, top);
    log.debug('scroll to ', scrollTop);
    OnNextLoop(() => scroll.scrollTo(0, scrollTop));
  }

  insertTags(parent, tags) {
    this.dom.toggleClass(parent, 'empty', tags.length == 0);
    tags.sort((a, b) => {
      return a.Name.localeCompare(b.Name);
    });

    for (const tag of tags) {
      const element = this.nodeTemplate.fill({
        '.tag': [
          new DataValue('id', tag.id),
          new DataValue('name', tag.name),
          new DataValue('path', media.getTagPath(tag))
        ],
        '.name': [new HtmlValue(tag.name)],
        '.hotkey .start.key': this.getHotkeyForTag(tag),
        "input[type='checkbox']": new InputValue(tag.hasFile(media.getFocus()))
      });
      this.dom.append(parent, element);
      const childTags = media.tags.getChildren(tag);

      const children = this.dom.first(element, '.children');
      this.insertTags(children, childTags);
    }
  }

  hoverStart(target) {
    this.oldFocus = document.activeElement;
    this.hotkeyInput = this.dom.first(target, 'input[name="key"]');
    this.hasHotkeyHover = this.hotkeyInput;
  }

  hoverEnd(target) {
    if (this.hotkeyInput) {
      this.hotkeyInput.blur();
    }
    if (this.oldFocus) {
      this.oldFocus.focus();
    }
    this.hasHotkeyHover = false;
  }

  hoverKeyPress(key) {
    if (!this.hasHotkeyHover) {
      return Continuation.Continue;
    }
    log.debug('hover keypress', key);
    const tag = this.getTagForElement(this.hotkeyInput);
    this.setHotkey(tag, null);

    if (key == 'Backspace') {
      this.setHotkey(tag, null);
      this.hotkeyInput.value = '';
    } else {
      const lc = key.toLowerCase();
      if (lc >= 'a' && lc <= 'z') {
        this.setHotkey(tag, lc);
        this.hotkeyInput.value = lc;
      }
    }

    this.fillHotkeys();
    if (!this.hasHotkeyHover) {
      log.debug('lost hotkeyhover');
    }
    return Continuation.StopAll;
  }

  searchBackspace() {
    this.searchText = this.searchText.slice(0, -1);
    this.fillSearch();
    return Continuation.StopAll;
  }

  resetSearch() {
    this.searchText = '';
    this.searchCursorPosition = 0;
    this.searchLevels = [];
    this.dom.setInnerHTML('.search .start', '');
    this.fillSearch();
    this.fillTree();
    this.dom.hide('div.create');
  }
  fillSearch() {
    const phrase = new SearchPhrase();
    const levelText = this.searchText.split('/');
    const levels = levelText.map((text) => {
      return text.split(/\s+/).filter((t) => {
        return t != '';
      });
    });
    if (levels[0] == '') {
      levels.shift();
    }
    for (const level of levels) {
      const searchLevel = new SearchLevel();
      for (const word of level) {
        const searchWord = new SearchWord(word);
        searchLevel.add(searchWord);
      }
      phrase.addLevel(searchLevel);
    }

    this.dom.setInnerHTML('.search .start', phrase.format());
    this.dom.toggleClass('.search', 'active', this.searchText.length > 0);
    this.searchNodes(phrase);
  }

  // eslint-disable-next-line complexity
  searchNodes(phrase) {
    const tags = this.dom.find('.quick-tag-tree .tags .tag');
    this.dom.hide('.quick-tag-tree div.create');
    this.dom.remove('.new');
    let firstMatch = true;
    for (const tag of tags) {
      log.never('search ', tag, phrase);
      const path = this.dom.getData(tag, 'path');
      const match = phrase.match(path);
      const label = this.dom.first(tag, 'span.name');
      const html = this.formatHtml(path, match);
      if (match.Success && match.NameMatch && match.Remainder?.length > 0) {
        this.dom.setData(tag, 'can_create', match.Remainder);
      } else {
        this.dom.removeData(tag, 'can_create');
      }
      this.dom.setInnerHTML(label, html);

      this.dom.toggleClass(tag, 'match', match.Success);
    }
    let createParent = '/';
    let createName = this.searchText;
    let isHotkey = false;
    let isRecent = false;
    for (const checkMatch of tags) {
      this.dom.removeClass(checkMatch, 'selected');
      const isMatch = this.dom.hasClass(checkMatch, 'match');
      const childMatch = this.dom.first(checkMatch, '.match');
      if (childMatch || isMatch) {
        this.dom.show(checkMatch);
        if (isMatch) {
          const htag = this.getHotkeyForTag(checkMatch.Id);
          const rtag = this.getRecentForTag(checkMatch.Id);
          if (firstMatch || (!isHotkey && htag) || (!isRecent && rtag)) {
            this.dom.addClass(checkMatch, 'selected');

            firstMatch = false;
            isHotkey = htag;
            isRecent = rtag;
          }
        }
        const newChild = this.dom.getData(checkMatch, 'can_create');
        const path = this.dom.getData(checkMatch, 'path');
        if (newChild && path.length > createParent.length) {
          createParent = path;
          createName = newChild;
        }
      } else {
        this.dom.show(checkMatch, false);
      }
    }
    this.showCreate(createParent, createName);
  }

  showCreate(parent, name) {
    const tag = media.getTags().getPath(`${parent}/${name}`);
    if (tag != null) {
      this.dom.hide('div.create');
    } else {
      this.dom.show('div.create');
      this.dom.setInnerHTML('div.create .parent', parent);
      this.dom.setInnerHTML('div.create .name', name);
    }
  }
  formatHtml(path, match) {
    if (match.Parts.length == 0) {
      const idx = path.lastIndexOf('/');
      return path.slice(idx + 1);
    }
    if (match.Parts.lengh == 0) {
      return path;
    }
    let html = '<div>';
    for (const part of match.Parts) {
      if (part.isDivider) {
        html = '<div>';
      } else if (part.IsSkip) {
        html += `<div class="word">${part.Text}</div>`;
      } else {
        html += `<div class="word"><b>${part.Text}</b></div>`;
      }
    }
    html = `${html}</div>`;
    return html;
  }

  async onCreateTag(_target, _event, _handler) {
    const tags = media.getTags();
    const parentPath = this.dom.getInnerHTML('div.create .parent');
    let parent = tags.getPath(parentPath);
    const name = this.dom.getInnerHTML('div.create .name');
    Assert.notNull(name, "createTag doesn't have a name");
    const parts = name.split('/');
    for (const part of parts) {
      const newName = part.trim();
      if (newName != null && newName != '') {
        // eslint-disable-next-line no-await-in-loop
        const child = await media.createTag(parent, newName);
        parent = child;
      }
    }
    this.selectTag(parent);
    this.resetSearch();
    this.fillTree();
  }

  async toggleTagSelect() {
    const node = this.dom.first('.tag.node.selected');
    const tagId = this.dom.getDataWithParent(node, 'id');
    const tag = media.getTagById(tagId);
    const focus = media.getFocus();
    if (tag != null && focus) {
      if (focus.hasTag(tag)) {
        this.unselectTag(tag);
      } else {
        this.selectTag(tag);
      }
    }
  }

  nextTag() {
    log.debug('nextTag');
    const sel = this.dom.first('.tag.node.selected');
    const matches = this.dom.find('.tag.node.match');
    if (matches.length > 1) {
      let idx = matches.indexOf(sel);
      idx = (idx + 1) % matches.length;
      const next = matches[idx];
      if (next) {
        this.dom.removeClass(sel, 'selected');
        this.dom.addClass(next, 'selected');
      }
    }
    return Continuation.StopAll;
  }
  prevTag() {
    log.debug('nextTag');
    const sel = this.dom.first('.tag.node.selected');
    const matches = this.dom.find('.tag.node.match');
    if (matches.length > 1) {
      let idx = matches.indexOf(sel);
      idx = idx == 0 ? match.lengh - 1 : idx - 1;
      const next = matches[idx];
      if (next) {
        this.dom.removeClass(sel, 'selected');
        this.dom.addClass(next, 'selected');
      }
    }
    return Continuation.StopAll;
  }
  copy() {
    this.copyTags = [].concat(media.getFocus()?.Tags);
  }
  paste() {
    if (this.copyTags && media.getFocus()) {
      this.copyTags.forEach((tag) => {
        this.selectTag(tag);
      });
    }
  }
  repeat() {
    if (this.previousTags && media.getFocus()) {
      this.previousTags.forEach((tag) => {
        this.selectTag(tag);
      });
    }
  }

  searchKeyPress(key) {
    if (key == 'Backspace') {
      this.searchText = this.searchText.slice(0, -1);
    } else {
      this.searchText = this.searchText.concat(key);
    }
    this.fillSearch();
    return Continuation.StopAll;
  }

  keyPress(key) {
    const focus = document.activeElement;
    if (focus == this.searchInput) {
      return Continuation.Continue;
    }
    if (this.hasHotkeyHover) {
      this.hoverKeyPress(key);
      return Continuation.StopAll;
    } else {
      this.searchInput.focus();
      return Continuation.Continue;
      // this.searchKeyPress(key);
    }
  }
  searchChange(val) {
    log.debug('search change ', val);
    this.searchText = val;
    this.fillSearch();
    return Continuation.StopAll;
  }
}
