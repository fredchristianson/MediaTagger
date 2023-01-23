import { ComponentBase } from "../../drjs/browser/component.js";
import { PropertyFilterComponent } from "./property-filter.js";
import { TagFilterComponent } from "./tag-filter.js";
import { AlbumFilterComponent } from "./album-filter.js";

export class MediaFilterComponent extends ComponentBase {
  constructor(selector, htmlName = "media-filter") {
    super(selector, htmlName);
  }
  async onHtmlInserted(_elements) {
    this.tags = new TagFilterComponent(this.dom.first(".tag-filter .filter"));
    this.albums = new AlbumFilterComponent(
      this.dom.first(".album-filter .filter")
    );
    this.properties = new PropertyFilterComponent(
      this.dom.first(".property-filter .filter")
    );
  }
}

export default MediaFilterComponent;
