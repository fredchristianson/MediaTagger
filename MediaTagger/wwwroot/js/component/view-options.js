import { dom } from '../../drjs/browser/dom.js';
import { ComponentBase } from '../../drjs/browser/component.js';
import { LOG_LEVEL, Logger } from '../../drjs/logger.js';

import main from './main.js';
const log = Logger.create('ViewOptions', LOG_LEVEL.DEBUG);
import { media } from '../modules/media.js';
import {
  Listeners,
  BuildClickHandler,
  BuildInputHandler,
  BuildWheelHandler,
  BuildCheckboxHandler,
  BuildCustomEventHandler,
  EventEmitter,
  ObjectEventType
} from '../../drjs/browser/event.js';
import { Settings } from '../modules/settings.js';

export const ZoomChangeEventType = new ObjectEventType('zoomChange');
export const ZoomEvent = new EventEmitter(ZoomChangeEventType);
export const ExpandGroupsEventType = new ObjectEventType('ExpandGroups');
export const ExpandGroupsEvent = new EventEmitter(ExpandGroupsEventType);
const MAX_ZOOM = 800;
const DEFAULT_SETTINGS = {
  zoom: 100,
  showSecondary: false,
  sort: 'Name'
};

export class ViewOptionsComponent extends ComponentBase {
  constructor(selector, htmlName = 'view-options') {
    super(selector, htmlName);
    this.listeners = [];
    this.zoomEmitter = ZoomEvent;
  }

  async onHtmlInserted(parent) {
    this.settings = await Settings.load('view', DEFAULT_SETTINGS);
    this.listeners = new Listeners(
      // new ClickHandler(".show-settings",this,this.showSettings),
      BuildClickHandler()
        .selector('.show-settings')
        .onClick(this, this.showSettings)
        .build(),
      BuildClickHandler()
        .selector('.show-media')
        .onClick(this, this.showMedia)
        .build(),
      BuildClickHandler()
        .selector('.show-tag-manager')
        .onClick(this, this.showTagManager)
        .build(),
      BuildClickHandler()
        .selector('.show-quick-tags')
        .onClick(this, this.showQuickTags)
        .build(),
      BuildClickHandler()
        .selector('.find-groups')
        .onClick(this, this.findGroups)
        .build(),
      BuildInputHandler()
        .selector("[name='zoom']")
        .onInput(this, this.zoom)
        .build(),
      BuildInputHandler()
        .selector("[name='zoom-slider']")
        .onInput(this, this.zoomSlider)
        .build(),
      BuildInputHandler()
        .selector("[name='search']")
        .onInput(this, this.search)
        .debounce(500)
        .build(),
      BuildCheckboxHandler()
        .selector("[name='expand-groups']")
        .onInput(this, this.expandGroupsChange)
        .build(),

      BuildInputHandler()
        .selector("[name='sort']")
        .onInput(this, this.sort)
        .build(),
      BuildWheelHandler()
        .listenTo('#content-view')
        .withAlt(true)
        .onChange(this, this.zoomWheel)
        .build(),
      BuildCustomEventHandler()
        .emitter(media.getSelectedItems().getUpdatedEvent())
        .onEvent(this, this.selectionInput)
        .build(),
      BuildInputHandler()
        .selector("[name='theme']")
        .onInput(this, this.changeTheme)
        .build(),
      BuildInputHandler()
        .selector("[name='font']")
        .onInput(this, this.setFont)
        .build(),
      BuildInputHandler()
        .selector("[name='layout-type']")
        .onInput(this, this.setLayoutType)
        .build()
    );
    const theme = this.settings.get('theme', 'theme-light');
    dom.addClass('body', theme);
    this.dom.setValue('[name="theme"]', theme);
    const font = this.settings.get('font', 'sans-serif');
    this.setFont(font);
    this.dom.setValue('[name="font"]', font);
    const layoutType = this.settings.get('layout-type', 'normal');
    this.setLayoutType(layoutType);
    this.dom.setValue('[name="layout-type"]', layoutType);
    this.zoomInput = this.dom.first('[name="zoom"]');
    this.zoomSlider = this.dom.first('[name="zoom-slider"]');
    this.dom.setAttribute(this.zoomInput, 'max', MAX_ZOOM);
    this.dom.setAttribute(this.zoomSlider, 'max', MAX_ZOOM);
    await this.setZoom(this.settings.get('zoom', 100));

    await this.setSort(this.settings.get('sort', 'Date'));
    await this.setExpandGroups(this.settings.get('showSecondary', false));
  }

  async expandGroupsChange(checked) {
    log.debug('expand groups', checked);
    await this.setExpandGroups(checked);
  }

  async setExpandGroups(expand) {
    this.dom.check("[name='expand-groups']", expand);
    ExpandGroupsEvent.emit(expand);
    media.showSecondaryGroupFiles(expand);
    await this.settings.set('showSecondary', expand);
  }
  selectionInput(selected) {
    log.debug('selection change ', selected.getLength());
    dom.toggleClass('#content-view', 'multi-select', selected.getLength() > 1);
  }
  search(text) {
    log.debug('search change ', text);
    media.setSearchText(text);
  }

  async sort(sortType) {
    log.debug('sort change ', sortType);
    await this.setSort(sortType);
  }

  async changeTheme(theme) {
    log.debug('theme change ', theme);
    const classList = dom.getBody().classList;
    for (const name of [...classList]) {
      if (name.startsWith('theme-')) {
        classList.remove(name);
      }
    }
    classList.add(theme);
    this.settings.set('theme', theme);
  }

  async setFont(font) {
    log.debug('font change ', font);
    const classList = dom.getBody().classList;
    for (const name of [...classList]) {
      if (name.startsWith('font-')) {
        classList.remove(name);
      }
    }
    classList.add(font);
    this.settings.set('font', font);
  }

  async setLayoutType(layoutType) {
    const classList = dom.getBody().classList;
    for (const name of [...classList]) {
      if (name.startsWith('layout-')) {
        classList.remove(name);
      }
    }
    classList.add(layoutType);
    this.settings.set('layout-type', layoutType);
  }

  async setSort(sortType) {
    this.dom.setValue("[name='sort']", sortType);
    media.setSortType(sortType.toLowerCase());
    await this.settings.set('sort', sortType);
  }
  onDetach() {
    this.listeners.remove();
  }

  async zoomWheel(delta) {
    log.debug('zoom wheel change ', delta);
    let value = dom.getValue('[name="zoom-slider"]');
    if (delta > 0) {
      value = value * 1.1;
    } else {
      value = value * 0.9;
    }

    if (value < 25) {
      value = 25;
    }
    if (value > MAX_ZOOM) {
      value = MAX_ZOOM;
    }
    value = Math.floor(value);
    dom.setValue('[name="zoom-slider"]', value);
    dom.setValue('[name="zoom"]', value);
    await this.setZoom(value);
  }

  async setZoom(value) {
    this.dom.setValue(this.zoomSlider, value);
    this.dom.setValue(this.zoomInput, value);
    await this.settings.set('zoom', value);

    this.zoomEmitter.emit(value);
  }

  async zoom(value) {
    log.debug('zoom input change ', value);
    await this.setZoom(value);
  }
  async zoomSlider(value) {
    log.debug('zoom slider change ', value);
    await this.setZoom(value);
  }
  showSettings(target, event) {
    main.instance.showSettings();
  }

  showMedia(target, event) {
    main.instance.showFiles();
  }

  showTagManager() {
    main.instance.showTagManager();
  }

  showQuickTags() {
    main.instance.showQuickTags();
  }

  findGroups(target, event) {
    main.instance.findGroups();
  }
}

export default ViewOptionsComponent;
