import { Logger } from '../logger.js';
import { util } from '../util.js';
import { DOM } from './dom.js';

const log = Logger.create('HtmlTemplate');

export class TemplateValue {
  constructor(value) {
    this._value = value;
  }

  get value() {
    return this._value;
  }

  set value(val) {
    this._value = val;
  }

  set(_element) {
    log.error(
      'derived class did not implement the set(element) method ',
      this.constructor.name
    );
  }
}

export class HtmlValue extends TemplateValue {
  constructor(value = null) {
    super(value);
  }

  set(element) {
    element.innerHTML = this._value;
  }
}

export class TextValue extends TemplateValue {
  constructor(value = null) {
    super(value);
  }

  set(element) {
    element.innerText = this._value;
  }
}

export class AttributeValue extends TemplateValue {
  constructor(attributeName, value = null) {
    super(value);
    this.attributeName = attributeName;
  }

  set(element) {
    element.setAttribute(this.attributeName, this._value);
  }
}

export class PropertyValue extends TemplateValue {
  constructor(attributeName, value = true) {
    super(value);
    this.attributeName = attributeName;
  }

  set(element) {
    DOM.setProperty(element, this.attributeName, this._value);
  }
}

export class ClassValue extends TemplateValue {
  constructor(value) {
    super(value);
  }

  set(element) {
    DOM.addClass(element, this._value);
  }
}

export class DataValue extends TemplateValue {
  constructor(name, value = true) {
    super(value);
    this.name = name;
  }

  set(element) {
    DOM.setData(element, this.name, this._value);
  }
}

export class InputValue extends TemplateValue {
  constructor(value) {
    super(value);
  }

  set(element) {
    DOM.setValue(element, this._value);
  }
}

export class ReplaceTemplateValue extends TemplateValue {
  constructor(oldValue, newValue) {
    super(null);
    this.oldValue = oldValue;
    this.newValue = newValue;
  }

  set(element) {
    element.innerText = element.innerText.replaceAll(
      this.oldValue,
      this.newValue
    );
    const attrs = element.getAttributeNames();
    attrs.forEach((name) => {
      const val = element.getAttribute(name);
      let newVal = this.newValue;
      if (typeof newVal == 'function') {
        newVal = newVal();
      }
      const rval = val.replaceAll(this.oldValue, newVal);
      element.setAttribute(name, rval);
    });
  }
}

export class HtmlTemplate {
  constructor(templateElement, initValues = null) {
    this.templateElement = templateElement;
    if (typeof this.templateElement === 'string') {
      this.nodes = this.stringToNodes(this.templateElement);
    } else if (
      this.templateElement
      && this.templateElement.tagName == 'SCRIPT'
    ) {
      // if the template is a script, process all elements in it
      this.nodes = this.stringToNodes(this.templateElement.innerHTML);
    } else {
      // the template is not a script, so there is only one node to process
      this.nodes = [this.templateElement];
    }
    this.initialize(initValues);
  }

  initialize(values) {
    if (values == null) {
      return;
    }
    this.nodes = this.fill(values);
  }

  getFirstNode() {
    const nodes = this.nodes.map((node) => {
      const clone = node.cloneNode(true);
      DOM.remove(DOM.find(clone, '.repeat'));
      return clone;
    });
    return nodes[0];
  }
  getNodes() {
    const nodes = this.nodes.map((node) => {
      const clone = node.cloneNode(true);
      DOM.remove(DOM.find(clone, '.repeat'));
      return clone;
    });
    return nodes;
  }

  stringToNodes(text) {
    const parent = document.createElement('div');
    parent.innerHTML = text.trim();
    return Array.from(parent.childNodes);
  }

  // values is a map of selectors and values
  fill(values = {}) {
    const filled = [];
    this.nodes.forEach((node) => {
      const clone = node.cloneNode(true);
      this.fillNode(clone, values);
      filled.push(clone);
    });
    return this.nodes.length != 1 ? filled : filled[0];
  }

  fillNode(node, values) {
    Object.keys(values).forEach((selector) => {
      const value = values[selector];
      const elements = node.matches(selector)
        ? [node]
        : DOM.find(node, selector);
      elements.forEach((element) => {
        if (DOM.hasClass(element, 'repeat') && Array.isArray(value)) {
          value.forEach((val) => {
            const clone = element.cloneNode(true);
            if (typeof val == 'object' && !(val instanceof TemplateValue)) {
              this.fillNode(clone, val);
            } else {
              this.setValue(clone, val);
            }
            DOM.removeClass(clone, 'repeat');
            element.parentNode.appendChild(clone);
          });
        } else {
          this.setValue(element, value);
        }
      });
    });
  }

  setValue(element, value) {
    if (util.isEmpty(value)) {
      element.innerHTML = '';
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((val) => this.setValue(element, val));
    } else if (typeof value === 'string' || typeof value === 'number') {
      if (element.value != null) {
        element.value = value;
      } else {
        element.innerHTML = value;
      }
    } else if (value instanceof TemplateValue) {
      value.set(element);
    } else {
      log.error('unknown template value type ', value);
    }
  }
}
export default HtmlTemplate;
