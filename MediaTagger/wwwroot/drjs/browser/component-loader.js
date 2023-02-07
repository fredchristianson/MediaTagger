import { assert } from '../assert.js';
import { Logger } from '../logger.js';
import { httpRequest } from './http-request.js';

const log = Logger.create('ComponentLoader');
log.never();

export class ComponentLoader {
  constructor() {
    this.componentDirectory = 'component';
  }

  async load(htmlFile) {
    assert.notEmpty(htmlFile);
    const fileExt = htmlFile.split('.');
    const fileName = htmlFile;
    let ext = '.html';
    if (fileExt.length > 1) {
      ext = fileExt[fileExt.length - 2];
      file = htmlFile.substr(htmlFile.length - ext.length);
    }
    const nocache = `?a=${  Date.now()}`;
    const filename = `${this.componentDirectory}/${fileName}${ext}${nocache}`;
    const contents = await httpRequest.get(filename);
    const htmlObject = document.createElement('div');
    htmlObject.innerHTML = contents.trim();
    const elements = Array.from(htmlObject.childNodes);
    return elements;
  }
}

export const componentLoader = new ComponentLoader();
