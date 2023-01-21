import Settings from "../modules/settings.js";
import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
const log = Logger.create("ImageWindow", LOG_LEVEL.DEBUG);

class ImageWindow {
  constructor() {
    this.showing = false;
    this.window = null;
    this.externalWindow = null;
    this.settings = null;
    window.addEventListener("beforeunload", this.close.bind(this), true);
  }

  close() {
    if (this.externalWindow) {
      this.externalWindow.close();
    }
  }
  async open() {
    if (this.externalWindow == null || this.externalWindow.closed) {
      // chrome won't open on another monitor.
      const settings = await this.getSettings();
      var pos = "";
      if (settings.get("width") != null && settings.get("height") != null) {
        log.debug("resize ", settings.get("width"), settings.get("height"));
        pos = `,top=${settings.get("top")},left=${settings.get("left")}`;
      }
      this.externalWindow = window.open(
        ``,
        "media-tagger-preview",
        "toolbar=false,resizeable=yes" + pos
      );
      if (settings.get("width") != null && settings.get("height") != null) {
        log.debug("resize ", settings.get("width"), settings.get("height"));

        this.externalWindow.resizeTo(
          settings.get("width"),
          settings.get("height")
        );
        this.externalWindow.moveTo(settings.get("left"), settings.get("top"));
      }
    }
    this.showing = true;
  }

  async setImage(image) {
    if (image != null && this.externalWindow && !this.externalWindow.closed) {
      const settings = await this.getSettings();
      settings.set("left", this.externalWindow.screenLeft);
      settings.set("top", this.externalWindow.screenTop);
      settings.set("width", this.externalWindow.outerWidth);
      settings.set("height", this.externalWindow.outerHeight);
      this.externalWindow.location.replace(image.getImageReloadUrl());
      // may use a cached image.  if .reload() is called before loading
      // finishes, it uses the previous (cached) version.  so wait for load then reload();
      this.externalWindow.addEventListener("load", async (event) => {
        this.externalWindow.location.reload();
      });
    }
  }
  async getSettings() {
    if (this.settings == null) {
      this.settings = await Settings.load("external-view");
    }
    return this.settings;
  }
}

const imageWindow = new ImageWindow();
export { imageWindow };
