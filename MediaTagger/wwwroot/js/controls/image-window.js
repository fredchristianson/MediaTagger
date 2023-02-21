import { Settings } from '../modules/settings.js';
import { LOG_LEVEL, Logger } from '../../drjs/logger.js';
const log = Logger.create('ImageWindow', LOG_LEVEL.DEBUG);
import { FocusEntityChangeEvent } from '../modules/media.js';
import { BuildCustomEventHandler } from '../../drjs/browser/event.js';
class ImageWindow {
  constructor() {
    this.showing = false;
    this.window = null;
    this.externalWindow = null;
    this.settings = null;
    this.url = null;
    window.addEventListener('beforeunload', this.close.bind(this), true);
    BuildCustomEventHandler()
      .emitter(FocusEntityChangeEvent)
      .onEvent(this, this.onFocusEntityUpdate)
      .build();
  }

  onFocusEntityUpdate() {
    if (this.externalWindow && this.url) {
      fetch(this.url, {
        cache: 'reload',
        mode: 'no-cors'
      }).then(() => {
        this.externalWindow.location.replace(this.url);

        this.externalWindow.addEventListener('load', async (event) => {
          this.externalWindow.location.reload();
        });
      });
    }
  }

  close() {
    if (this.externalWindow) {
      this.externalWindow.close();
    }
    this.url = null;
  }
  // eslint-disable-next-line complexity
  async open() {
    if (this.externalWindow == null || this.externalWindow.closed) {
      // chrome won't open on another monitor.
      const settings = await this.getSettings();
      let pos = '';
      if (settings.get('width') != null && settings.get('height') != null) {
        log.debug('resize ', settings.get('width'), settings.get('height'));
        pos = `,top=${settings.get('top')},left=${settings.get('left')}`;
      }
      this.externalWindow = window.open(
        this.url,
        'media-tagger-preview',
        `toolbar=false,resizeable=yes${pos}`
      );
      if (this.externalWindow) {
        this.externalWindow.addEventListener('load', async (event) => {
          //this.externalWindow.location.reload();
          this.externalWindow.location = this.url;

          if (settings.get('width') != null && settings.get('height') != null) {
            log.debug('resize ', settings.get('width'), settings.get('height'));

            this.externalWindow.resizeTo(
              settings.get('width'),
              settings.get('height')
            );
            this.externalWindow.moveTo(
              settings.get('left'),
              settings.get('top')
            );
          }
        });
      }
    }
    this.showing = true;
  }

  async setImage(image) {
    this.url = image?.getImageReloadUrl();

    if (image != null && this.externalWindow && !this.externalWindow.closed) {
      const settings = await this.getSettings();
      settings.set('left', this.externalWindow.screenLeft);
      settings.set('top', this.externalWindow.screenTop);
      settings.set('width', this.externalWindow.outerWidth);
      settings.set('height', this.externalWindow.outerHeight);
    }
    if (this.externalWindow) {
      this.externalWindow.location.replace(this.url);
      /*
       * may use a cached image.  if .reload() is called before loading
       * finishes, it uses the previous (cached) version.  so wait for load then reload();
       */
      this.externalWindow.addEventListener('load', async (event) => {
        this.externalWindow.location.reload();
      });
    }
  }
  async getSettings() {
    if (this.settings == null) {
      this.settings = await Settings.load('external-view');
    }
    return this.settings;
  }
}

export const imageWindow = new ImageWindow();
