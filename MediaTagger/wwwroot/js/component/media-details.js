import { ComponentBase } from "../../drjs/browser/component.js";
import PropertiesComponent from './properties.js';
import TagsComponent from './tags.js';

export class MediaDetailsComponent extends ComponentBase {
  constructor(selector, htmlName = "media-details") {
    super(selector, htmlName);
  }

  async onHtmlInserted(elements) {
    this.tags = new TagsComponent("#tags");
    this.properties = new PropertiesComponent("#properties");
  }
}

export default MediaDetailsComponent;
