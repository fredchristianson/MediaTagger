class ImageWindow {
  constructor() {
    this.showing = false;
    this.window = null;
    this.externalWindow = null;
  }

  open() {
    if (this.externalWindow == null || this.externalWindow.closed) {
      this.externalWindow = window.open(
        `/image/${focus.Id}`,
        "media-tagger-preview",
        "toolbar=false,resizeable=yes"
      );
    }
    this.showing = true;
  }

  setImage(image) {
    if (image != null && this.externalWindow && !this.externalWindow.closed) {
      this.externalWindow.location.replace(image.getImageUrl());
      // may use a cached image.  if .reload() is called before loading
      // finishes, it uses the previous (cached) version.  so wait for load then reload();
      this.externalWindow.addEventListener("load", () => {
        this.externalWindow.location.reload();
      });
    }
  }
}

const imageWindow = new ImageWindow();
export { imageWindow };
