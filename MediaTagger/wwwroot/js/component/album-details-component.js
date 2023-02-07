import { ComponentBase } from '../../drjs/browser/component.js';
import {
  BuildCheckboxHandler,
  BuildCustomEventHandler,
  Listeners
} from '../../drjs/browser/event.js';
import { HtmlTemplate, DataValue } from '../../drjs/browser/html-template.js';
import { media, FocusChangeEvent } from '../modules/media.js';
import { LOG_LEVEL, Logger } from '../../drjs/logger.js';

const log = Logger.create('AlbumComponent', LOG_LEVEL.DEBUG);

class AlbumDetailsComponent extends ComponentBase {
  constructor(selector, htmlName = 'album-details') {
    super(selector, htmlName);
    this.listeners = new Listeners();
    this.media = media;
  }

  async onHtmlInserted(_elements) {
    this.template = new HtmlTemplate(this.dom.first('.album-details-template'));

    this.listeners.add(
      BuildCheckboxHandler()
        .listenTo(this.dom.first('ul'), 'input[type="checkbox"]')
        .onChecked(this, this.albumSelected)
        .onUnchecked(this, this.albumUnselected)
        .setData((element) => {
          return this.dom.getDataWithParent(element, 'id');
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

    const checks = this.dom.find('input.check');
    this.dom.show(checks, selected.Length > 0);

    const selectedAlbums = {};
    for (const sel of selected) {
      for (const album of sel.getAlbums()) {
        let st = selectedAlbums[album.getId()];
        if (st == null) {
          st = { id: album.getId(), count: 0 };
          selectedAlbums[album.getId()] = st;
        }
        st.count += 1;
      }
    }

    const count = selected.Length;
    checks.forEach((check) => {
      const id = this.dom.getDataWithParent(check, 'id');
      const st = selectedAlbums[id];
      const tagElement = this.dom.closest(check, 'label');
      this.dom.show(tagElement, st != null);
      if (st == null) {
        this.dom.uncheck(check);
        this.dom.removeClass(tagElement, 'partial');
      } else {
        this.dom.check(check);
        this.dom.toggleClass(tagElement, 'partial', st.count < count);
      }
    });
  }

  onAlbumListChange() {
    this.dom.removeChildren('ul.items.album-list');
    const albums = media.getAlbums();
    for (const album of albums) {
      const item = this.template.fill({
        'input.check': new DataValue('id', album.getId()),
        'span.name': album.getName()
      });
      this.dom.append('ul.items.album-list', item);
    }
  }

  albumSelected(id) {
    log.debug('selected album ', id);
    media.albumAddSelected(id);
  }

  albumUnselected(id) {
    media.albumRemoveSelected(id);
  }
}

export { AlbumDetailsComponent };
