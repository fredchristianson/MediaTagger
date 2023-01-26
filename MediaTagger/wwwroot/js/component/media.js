import { ComponentBase } from '../../drjs/browser/component.js';
import {
  HtmlTemplate,
  ReplaceTemplateValue,
  DataValue
} from '../../drjs/browser/html-template.js';
import { LOG_LEVEL, Logger } from '../../drjs/logger.js';
import { Listeners, BuildClickHandler } from '../../drjs/browser/event.js';
import MediaDetailsComponent from './media-details.js';
import DateFilterComponent from './date-filter.js';
import MediaFilterComponent from './media-filter.js';
import {media}  from '../modules/media.js';
import { GridLayout } from '../modules/layout.js';
import { RightGridSizer, LeftGridSizer } from '../modules/drag-drop.js';
const log = Logger.create('MediaComponent', LOG_LEVEL.DEBUG);

export class MediaComponent extends ComponentBase {
  constructor(selector, htmlName = 'media') {
    super(selector, htmlName);
    this.listeners = new Listeners();
    this.filterSizer = null;
    this.detailsSizer = null;
  }

  async onHtmlInserted(elements) {
    this.mediaDetails = new MediaDetailsComponent('#media-details');
    this.dateFilter = new DateFilterComponent('#date-filter');
    this.mediaFilter = new MediaFilterComponent('#media-filter');
    this.filterSizer = new RightGridSizer();
    this.detailsSizer = new LeftGridSizer();

    let allItems = await media.getVisibleItems();
    let template = new HtmlTemplate(this.dom.first('#media-item-template'));

    this.layout = new GridLayout('.items', allItems, (item) => {
      let htmlItem = template.fill({
        '.media-item': [new DataValue('media-id', item.getId())],
        '.name': item.name,
        '.thumbnail': new ReplaceTemplateValue(
          '{thumbnail}',
          item.getThumbnailUrl.bind(item)
        )
      });
      return htmlItem;
    });
    this.navigation = new Navigation(this.layout);

    this.listeners.add(
      BuildClickHandler()
        .listenTo(this.dom, '.media-item')
        .onClick(this, this.clickItem)
        .onLeftClick(this, this.leftClick)
        .onRightClick(this, this.rightClick)
        .onMiddleClick(this, this.middleClick)
        .setData((element) => {
          return {
            item: media.getAllItems().getById(
              this.dom.getData(element, 'mediaid')
            ),
            file: media.getAllItems().getById(
              this.dom.getData(element, 'fileid')
            )
          };
        })
        .build()
    );
  }

  async onDetach() {
    this.layout.detach();
    this.listeners.removeAll();
    if (this.filterSizer) {
      this.filterSizer.detach();
    }
    if (this.detailsSizer) {
      this.detailsSizer.detach();
    }
  }

  clickItem(element, data, event, handler) {
    log.debug('click element ');
  }
  leftClick(element, data, event, handler) {
    log.debug('leftClick element ');
    if (event.hasShift) {
      media.selectToItem(data.item);
    } else if (event.hasCtrl) {
      media.toggleSelectItem(data.item);
    } else {
      media.selectItem(data.item);
    }
  }
  rightClick(element, data, event, handler) {
    media.selectToItem(data.item);
  }
  middleClick(element, data, event, handler) {
    media.toggleSelectItem(data.item);
  }
}

export default MediaComponent;
