import { ComponentBase } from '../../drjs/browser/component.js';
import {
  BuildCheckboxHandler,
  BuildCustomEventHandler,
  BuildHoverHandler,
  BuildInputHandler,
  Continuation,
  Listeners
} from '../../drjs/browser/event.js';
import { BuildClickHandler } from '../../drjs/browser/event.js';
import {
  HtmlTemplate,
  PropertyValue,
  DataValue,
  AttributeValue
} from '../../drjs/browser/html-template.js';
import { media, FilterChangeEvent } from '../modules/media.js';
import { Settings } from '../modules/settings.js';
import { LOG_LEVEL, Logger } from '../../drjs/logger.js';
import Album from '../data/album.js';
import { Dialog } from '../controls/dialog.js';
import { dom } from '../../drjs/browser/dom.js';

const log = Logger.create('AlbumComponent', LOG_LEVEL.DEBUG);

function NameCompareFunction(a, b) {
  if (a == null) {
    return -1;
  }
  if (b == null) {
    return -1;
  }
  return a.getName().localeCompare(b.getName());
}

async function createAlbum(values) {
  log.info('createAlbum ', values);
  try {
    let result = await media.createAlbum(values.name, values.description);
    if (result && result instanceof Album) {
      return true;
    }
    return (
      (result && result.message) ?? 'Create Album ' + values.name + ' failed.'
    );
  } catch (response) {
    return (
      (response && response.message) ??
      'Create Album ' + values.name + ' failed.'
    );
  }
}

function cancelCreateAlbum() {
  log.info('createAlbum canceled');
}

export class AlbumFilterComponent extends ComponentBase {
  constructor(selector, htmlName = 'album-filter') {
    super(selector, htmlName);
    this.listeners = new Listeners();
    this.media = media;
    this.filterAllowAll = true;
    this.selectedAlbumIds = [];
  }

  async onHtmlInserted(elements) {
    this.settings = await Settings.load('album-filter', {});

    this.template = new HtmlTemplate(this.dom.first('.album-filter-template'));
    this.newTemplate = new HtmlTemplate(this.dom.first('.new-album-dialog'));

    this.listeners.add(
      BuildCheckboxHandler()
        .listenTo(this.dom.first('ul'), "input[type='checkbox']")
        .onChange(this, this.selectChanged)
        .setData((element) => {
          return this.dom.getDataWithParent(element, 'id');
        })
        .build(),
      BuildClickHandler()
        .listenTo('#album-filter', '.add-album')
        .setDefaultContinuation(Continuation.StopAll)
        .capture()
        .onClick(this, this.addAlbum)
        .build(),
      BuildCustomEventHandler()
        .emitter(media.getAlbums().getUpdatedEvent())
        .onEvent(this, this.onAlbumListChange)
        .build()
    );
    this.onAlbumListChange();
    media.addFilter(this.filterItem.bind(this));
  }

  addAlbum() {
    log.debug('add album');
    let dialog = new Dialog(this.newTemplate, createAlbum, cancelCreateAlbum);
    dialog.show();
  }

  showAlbumCount() {
    const checks = this.dom.find('input.check');
    const checked = checks.filter((c) => {
      return c.checked;
    });
    const selCount = checked.length;
    const totalCount = checks.length;
    const msg = `(${selCount} of ${totalCount})`;
    dom.setInnerHTML('#album-filter .selected.count', msg);
    this.filterAllowAll = selCount == 0;
    this.selectedAlbumIds = this.dom.find('input:checked').map((c) => {
      return this.dom.getDataWithParent(c, 'id');
    });
  }
  onAlbumListChange() {
    let albums = media.getAlbums();
    let list = this.dom.first('ul.albums');
    this.dom.removeChildren(list);
    if (albums.Length == 0) {
      //let li = this.dom.createElement("li", "no albums exist");
      let li = this.dom.createElement(
        "<li><a class='add-album' href='#'>create album</a></li>"
      );
      this.dom.append(list, li);
      return;
    }

    let sorted = [...albums].sort(NameCompareFunction);
    for (let album of sorted) {
      let state = this.settings.get(`album-state-${album.getId()}`, 'checked');
      let listItem = this.template.fill({
        li: new DataValue('id', album.getId()),
        '.check-state': new DataValue('state', state),
        'input.check': new PropertyValue('checked', state == 'checked'),
        'span.name': album.getName()
      });
      this.dom.append(list, listItem);
    }
    this.showAlbumCount();
  }

  selectChanged(id, val, element) {
    log.debug('id change ', id, val);
    let state = val ? 'checked' : 'unchecked';
    this.settings.set(`album-state-${id}`, state);
    let label = this.dom.closest(element, '.check-state');
    this.dom.setData(label, 'state', state);
    this.showAlbumCount();
    media.clearFocus();
    media.clearSelection();
    FilterChangeEvent.emit();
  }

  filterItem(item) {
    if (this.filterAllowAll) {
      return true;
    }
    return this.selectedAlbumIds.find((id) => {
      return item.hasAlbum(id);
    });
  }
}

export default AlbumFilterComponent;
