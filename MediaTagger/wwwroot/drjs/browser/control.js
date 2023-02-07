import { Assert } from '../assert.js';
import { Logger } from '../logger.js';
import { Listeners } from './event.js';

const log = Logger.create('Control');
log.never();

class Control {
  constructor(component, root) {
    Assert.notNull(component, 'Control() needs a component');
    Assert.notNull(root, 'Control() needs a dom element');
    this.component = component;
    this.dom = component.dom;
    this.root = this.dom.first(root);
    this.listeners = new Listeners();

    component.addControl(this);
  }

  detach() {
    this.listeners.removeAll();
  }
}

export { Control };
