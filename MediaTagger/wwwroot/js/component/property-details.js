import { LOG_LEVEL, Logger } from '../../drjs/logger.js';
import { ComponentBase } from '../../drjs/browser/component.js';
import {
  BuildCustomEventHandler,
  BuildClickHandler,
  Listeners
} from '../../drjs/browser/event.js';

import { media } from '../modules/media.js';
import { Settings } from '../modules/settings.js';

const log = Logger.create('PropertyDetails', LOG_LEVEL.DEBUG);

export class PropertyDetailsComponent extends ComponentBase {
  constructor(selector, htmlName = 'property-details') {
    super(selector, htmlName);
    this.listeners = new Listeners();
    this.sizes = [];
    this.resolutions = [];
    this.extensions = [];
  }

  async onHtmlInserted(elements) {
    this.settings = await Settings.load('property-details');
    this.dom.removeClass('.properties', 'selected');
    this.externalWindow = null;
    this.listeners.add(
      BuildClickHandler()
        .listenTo('.external-preview')
        .onClick(this, this.externalPreview)
        .build(),
      BuildCustomEventHandler()
        .emitter(media.getFocusChangeEvent())
        .onEvent(this, this.focusChange)
        .build()
    );
  }

  externalPreview() {
    this.externalWindow = null;
    this.openExternalWindow();
  }

  openExternalWindow() {
    const focus = media.getFocus();
    if (focus == null) {
      return;
    }
    if (this.externalWindow) {
      if (this.externalWindow.closed) {
        log.debug('preview window is closed');
        this.externalWindow = null;
        return;
      }
      this.externalWindow.location = `/image/${focus.Id}?d=${Date.now()}`;
    } else {
      this.externalWindow = window.open(
        `/image/${focus.Id}`,
        'media-tagger-preview',
        'toolbar=false,resizeable=yes'
      );
      this.externalWindow.onload = () => {
        log.debug('loaded');
      };
    }
  }
  focusChange() {
    const focus = media.getFocus();
    this.dom.toggleClass('.properties', 'selected', focus != null);
    if (focus == null) {
      return;
    }
    const sel = media.getSelectedItems();
    if (sel.getLength() <= 1) {
      this.dom.setInnerHTML('h1 .name', focus.getName());
    } else {
      this.dom.show('h1 .name');
      this.dom.setInnerText(
        'h1 .name',
        `${focus.getName()} (+ ${sel.getLength() - 1})`
      );
    }
    this.dom.setInnerHTML('.extension', focus.getExtension());
    this.dom.setInnerHTML(
      '.resolution',
      `${focus.getWidth()} x ${focus.getHeight()}`
    );
    this.dom.setInnerHTML('.media-file-id', `ID: ${focus.getId()}`);
    this.dom.setAttribute(
      '.preview img',
      'src',
      `/image/${focus.getId()}?d=${Date.now()}`
    );
    if (this.externalWindow) {
      this.openExternalWindow();
    }
    this.dom.removeClass('.preview', ['rotate-90', 'rotate-180', 'rotate-270']);
    const preview = this.dom.first('.preview');
    const img = this.dom.first(preview, 'img');

    img.style.maxHeight = `${preview.offsetHeight}px`;
    img.style.maxWidth = `${preview.offsetWidth}px`;
    img.style.left = '0px';
  }
}

export default PropertyDetailsComponent;
