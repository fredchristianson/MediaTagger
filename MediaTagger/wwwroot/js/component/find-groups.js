import Util from '../../drjs/util.js';

import { ComponentBase } from '../../drjs/browser/component.js';
import {
  HtmlTemplate,
  AttributeValue
} from '../../drjs/browser/html-template.js';
import { LOG_LEVEL, Logger } from '../../drjs/logger.js';
import {
  BuildCustomEventHandler,
  Listeners
} from '../../drjs/browser/event.js';
import {media}  from '../modules/media.js';
import { ObservableArray } from '../modules/collections.js';
import { BackgroundTask } from '../../drjs/browser/task.js';
import dom from '../../drjs/browser/dom.js';
const log = Logger.create('FileGroup', LOG_LEVEL.DEBUG);

class FileGroup {
  constructor() {}
}

export class FindGroupsComponent extends ComponentBase {
  constructor(selector, htmlName = 'find-groups') {
    super(selector, htmlName);
    this.groups = new ObservableArray();
    this.listeners = new Listeners();
    this.task = null;
  }

  async onGroupsUpdated(list) {
    this.dom.setInnerHTML('.group-count', list.length);
  }

  async onHtmlInserted(elements) {
    this.matchTemplate = new HtmlTemplate(this.dom.first('#group-match'));
    this.matches = dom.first('.matches');
    this.listeners.add(
      BuildCustomEventHandler()
        .emitter(this.groups.updatedEvent)
        .onEvent(this, this.onGroupsUpdated)
        .build()
    );
    this.allFiles = await media.getAllFiles();
    this.unattached = [...this.allFiles].filter((f) => {
      return f.fileSetPrimaryId == null;
    });

    this.task = BackgroundTask.batch(
      1000,
      this.unattached,
      this.analyzeFile.bind(this)
    );
  }

  analyzeFile(file) {
    //log.debug("analyze ", file.getId());
    const fid = file.getId();
    const fname = file.getName();
    const fsize = file.getFileSize();
    const msecs = file.getTakenMSecs();
    let match = null;
    for (const test of this.allFiles) {
      if (test.getId() <= fid) {
        continue;
      }
      if (test.getName().startsWith(fname)) {
        match = {
          reason: `${test.getId()}-${fid} name match ${test.getName()}==${fname}`,
          file,
          test
        };
      } else if (test.getFileSize() == fsize) {
        let ignorematch = {
          reason: `size match ${test.getFileSize()}==${fsize}`,
          file,
          test
        };
      } else if (msecs != null) {
        const tmsecs = test.getTakenMSecs();
        if (tmsecs != null && Math.abs(tmsecs - msecs) < 1000) {
          match = { reason: `time match ${tmsecs}==${msecs}`, file, test };
        }
      }
      if (match != null) {
        break;
      }
    }
    if (match != null) {
      let element = this.matchTemplate.fill({
        '.reason': match.reason,
        '.img1': new AttributeValue(
          'src',
          `/thumbnail/${match.file.getId()}?v=7`
        ),
        '.img2': new AttributeValue(
          'src',
          `/thumbnail/${match.test.getId()}?v=7`
        )
      });
      dom.append(this.matches, element);
    }
  }

  async onDetach() {
    if (this.task) {
      this.task.cancel();
    }
    this.listeners.removeAll();
  }
}

export default FindGroupsComponent;
