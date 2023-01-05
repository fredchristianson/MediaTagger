import { ComponentBase } from "../../drjs/browser/component.js";
import TagsComponent from "./tags.js";
import { BottomGridSizer } from "../modules/drag-drop.js";

export class MediaDetailsComponent extends ComponentBase {
  constructor(selector, htmlName = "media-details") {
    super(selector, htmlName);
  }

  async onHtmlInserted(elements) {
    this.tags = new TagsComponent("#tags");
    //this.properties = new PropertiesComponent("#properties");
    this.tagSizer = new BottomGridSizer(".grid-sizer.bottom", "#tags");
  }
}

export default MediaDetailsComponent;
