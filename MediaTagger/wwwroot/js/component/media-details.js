import { ComponentBase } from '../../drjs/browser/component.js';
import { TagDetailsComponent } from './tag-details.js';
import { PropertyDetailsComponent } from './property-details.js';
import { BottomGridSizer } from '../modules/drag-drop.js';
import { AlbumDetailsComponent } from './album-details-component.js';

export class MediaDetailsComponent extends ComponentBase {
  constructor(selector, htmlName = 'media-details') {
    super(selector, htmlName);
  }

  async onHtmlInserted(elements) {
    this.tags = new TagDetailsComponent('#tag-details');
    this.albums = new AlbumDetailsComponent('#album-details');
    this.properties = new PropertyDetailsComponent(
      '#media-details .details.property'
    );
    this.tagSizer = new BottomGridSizer(
      '.grid-sizer.bottom',
      '#tag-album-details'
    );
  }
}

export default MediaDetailsComponent;
