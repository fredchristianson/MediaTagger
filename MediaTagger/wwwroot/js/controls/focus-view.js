import { Control } from '../../drjs/browser/control.js';
import {
  BuildCustomEventHandler,
  BuildClickHandler,
  Continuation
} from '../../drjs/browser/event.js';
import {
  media,
  FocusChangeEvent,
  FocusEntityChangeEvent
} from '../modules/media.js';
import { imageWindow } from './image-window.js';
import { Logger } from '../../drjs/logger.js';
import { LogLevel } from '../../drjs/logger-interface.js';

const log = new Logger('FocusView', LogLevel.DEBUG);

function sortTagPaths(tags) {
  const paths = tags.map((t) => {
    return media.getTagPath(t).split('/');
  });

  return paths.map((p) => {
    return `/${p.join('/')}`;
  });
}
class FocusView extends Control {
  constructor(component, root) {
    super(component, root);

    this.listeners.add(
      BuildCustomEventHandler()
        .emitter(media.getVisibleItems().getUpdatedEvent())
        .onEvent(this, this.onFileChange)
        .build(),
      BuildCustomEventHandler()
        .emitter(FocusChangeEvent)
        .onEvent(this, this.onFocusChange)
        .build(),
      BuildCustomEventHandler()
        .emitter(FocusEntityChangeEvent)
        .onEvent(this, this.onFocusEntityUpdate)
        .build(),

      BuildClickHandler()
        .setDefaultContinuation(Continuation.StopAll)
        .listenTo(this.dom, '.images img')
        .onClick(this, this.onSelectImage)
        .build(),
      BuildClickHandler()
        .setDefaultContinuation(Continuation.StopAll)
        .listenTo(this.dom, '.big-view')
        .onClick(this, this.openPreviewWindow)
        .build()
    );
    this.imageWindow = imageWindow;
    this.fillImages();
  }

  onFocusChange() {
    this.fillImages();
  }

  onFocusEntityUpdate(item) {
    // this.fillImageTags();
    const img = this.dom.first('img.image');
    fetch(item.getThumbnailUrl(), {
      cache: 'reload',
      mode: 'no-cors'
    }).then(() => {
      img.src = item.getThumbnailUrl();
    });
  }
  onSelectImage(target, _event, _handler) {
    const offset = this.dom.getData(target, 'offset', 'number');
    if (offset != 0) {
      media.moveFocus(offset);
      this.fillImages();
    }
  }

  onFileChange() {
    log.never('focus-view onVisibleItemChange');
    this.visibleItems = media.getVisibleItems();
    this.fillImages();
  }

  async openPreviewWindow() {
    await this.imageWindow.open();
    this.imageWindow.setImage(media.getFocus());
  }

  fillImages() {
    const images = this.dom.find('.images', 'img');

    const focusIndex = media.getFocusIndex();
    const visibleItems = media.getVisibleItems();
    while (images.length > 0) {
      const img = images.shift();
      const offset = this.dom.getData(img, 'offset');
      const item = visibleItems.getItemAt(offset + focusIndex);
      if (item == null) {
        this.dom.setAttribute(img, 'src', 'image/1x1.png');
      } else if (this.dom.hasClass(img, 'thumb')) {
        this.dom.setAttribute(img, 'src', item.getThumbnailUrl());
        this.dom.removeChildren(img, 'rotate-90');
        this.dom.removeChildren(img, 'rotate-360');
        if (item.RotationDegrees) {
          this.dom.addClass(
            img,
            `rotate-${(item.RotationDegrees + 360) % 360}`
          );
        }
      } else {
        this.dom.setAttribute(img, 'src', item.getImageReloadUrl());
      }
    }
    this.imageWindow.setImage(media.getFocus());

    this.fillImageTags(media.getFocus());
  }

  fillImageTags(image) {
    const container = this.dom.first('.image-tags');
    this.dom.removeChildren(container);

    if (image != null) {
      for (const tag of sortTagPaths(image.Tags)) {
        const child = this.dom.createElement(`<div>${tag}</div>`);
        this.dom.append(container, child);
      }
    }
  }
}

export { FocusView };
