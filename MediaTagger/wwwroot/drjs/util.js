const hhRegex = new RegExp('HH', 'g');
const mmRegex = new RegExp('MM', 'g');
const SSRegex = new RegExp('SS', 'g');
const ssssRegex = new RegExp('ssss', 'g');
const sssRegex = new RegExp('sss', 'g');
const ssRegex = new RegExp('ss', 'g');
const sRegex = new RegExp('s', 'g');

class Util {
  constructor() {
    this._log = null;
  }

  isNull(item) {
    // treat "undefined" and null items the same
    return typeof item === 'undefined' || item === null;
  }

  isEmpty(item) {
    if (typeof item === 'undefined' || item === null) {
      return true;
    } else if (typeof item === 'string') {
      return item.trim().length === 0;
    } else if (Array.isArray(item)) {
      return item.length === 0;
    }
    return false;
  }
  toArray(data) {
    if (typeof data === 'undefined' || data === null) {
      return [];
    } else if (Array.isArray(data)) {
      return data;
    } else {
      return [data];
    }
  }

  // eslint-disable-next-line complexity
  toString(item) {
    // return a string value of the item.  If it is JSON, remove cycles
    const type = typeof item;
    if (this.isEmpty(item)) {
      return '';
    } else if (type === 'string') {
      return item;
    } else if (item instanceof HTMLElement) {
      const parts = [];
      const tag = item.tagName;
      parts.push('[');
      parts.push(tag);
      if (item.id) {
        parts.push('#');
        parts.push(item.id);
      }

      const classes = item.classList;
      classes.forEach((c) => {
        parts.push('.');
        parts.push(c);
      });
      parts.push(']');
      return parts.join('');
    } else if (type === 'object') {
      let seen = [];
      const deCycle = function (key, val) {
        if (val != null && typeof val === 'object') {
          if (seen.includes(val)) {
            return '...';
          }
          seen.push(val);
        }
        return val;
      };

      let result = `\n${  JSON.stringify(item, deCycle, 2)  }\n`;
      if (item.message) {
        result = item.message + result;
      }
      seen = null;
      return result;
    } else if (typeof item.toString()) {
      return item.toString();
    } else {
      return `${item}`;
    }
  }

  toNumber(val, defaultValue) {
    try {
      const n = Number.parseInt(val);
      if (isNaN(n)) {
        return defaultValue;
      }
      return n;
    } catch (ex) {
      return defaultValue;
    }
  }

  removeItem(array, item) {
    for (let idx = 0; idx < array; idx++) {
      if (array[idx] === item) {
        array.splice(idx, 1);
        idx = idx - 1;
      }
    }
  }

  /* string utilities */
  padRight(val, length, pad = ' ', truncate = false) {
    /*
     * add spaces on the right to make the string "length" characters.
     * If truncate==true remove characters beyond "length"
     */
    let text = this.toString(val);
    if (this.isEmpty(text)) {
      return pad.repeat(length);
    }
    if (text.length < length) {
      text = text + pad.repeat(length - text.length);
    }
    if (truncate && text.length > length) {
      text = text.substr(0, length);
    }
    return text;
  }

  padLeft(val, length, pad = ' ', truncate = false) {
    /*
     * add spaces on the right to make the string "length" characters.
     * If truncate==true remove characters beyond "length"
     */
    let text = this.toString(val);
    if (this.isEmpty(text)) {
      return pad.repeat(length);
    }
    if (text.length < length) {
      text = pad.repeat(length - text.length) + text;
    }
    if (truncate && text.length > length) {
      text = text.substr(text.length - length, text.length);
    }
    return text;
  }

  /* time/date functions */
  formatTime(time = null, format = 'HH:MM:SS') {
    let result = '';
    try {
      const date = this.getDate(time);
      const hour = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();
      const msecs = date.getMilliseconds();
      return format
        .replace(hhRegex, this.formatHour(hour))
        .replace(mmRegex, this.padLeft(minutes, '0', 2))
        .replace(SSRegex, this.padLeft(seconds, '0', 2))
        .replace(ssssRegex, this.padRight(msecs, '0', 4))
        .replace(sssRegex, this.padRight(msecs, '0', 3))
        .replace(ssRegex, this.padRight(msecs, '0', 2))
        .replace(sRegex, this.padRight(msecs, '0', 1));
    } catch (err) {
      // because of circular dependencies we cannot log from util.js
      result = `date error ${  time}`;
    }
    return result;
  }

  formatHour(h) {
    if (h == 0) {
      return 12;
    }
    if (h < 13) {
      return h;
    }
    return h - 12;
  }

  getDate(val) {
    let date = null;
    try {
      if (val instanceof Date) {
        return val;
      } else if (typeof val == 'string') {
        date = new Date(Date.parse(val));
      } else if (Number.isInteger(val)) {
        date = new Date(val);
      } else {
        date = new Date();
      }
    } catch (err) {
      log.error('cannot convert value to Date()', val, err);
    }
    return date;
  }

  getOptions(optionDefs, args) {
    const options = {};
    optionDefs.forEach((opt) => {
      options[opt.name] = opt.defaultValue;
    });
    if (this.isEmpty(args)) {
      return options;
    }

    for (let idx = 0; idx < optionDefs.length; idx++) {
      const def = optionDefs[idx];
      const name = def.name;
      // allow typeName to be a string or array of types
      const types = this.toArray(def.types);
      let val = def.defaultValue || null;

      const byType = args.filter((arg) => {
        if (typeof arg === 'object') {
          if (this.isType(arg, types)) {
            return arg;
          } else if (arg.constructor.name == 'object') {
            const member = this.getMemberByType(this.typeNames, arg);
            return member;
          }
        }
        return false;
      });
      if (byType.length === 1) {
        val = byType[0];
      } else if (byType.length > 1) {
        val = byType;
      }
      options[name] = val;
    }

    for (let nidx = 0; nidx < optionDefs.length; nidx++) {
      const def = optionDefs[nidx];
      args.forEach((arg) => {
        if (typeof arg == 'object' && !this.isNull(arg[def.name])) {
          options[def.name] = arg[def.name];
        }
      });
    }
    return options;
  }

  isType(object, types) {
    types = this.toArray(types);
    return !this.isNull(
      types.find((type) => {
        if (typeof type === 'string') {
          return object.constructor.name == type;
        }
        return object instanceof type;
      })
    );
  }

  getMemberByType(typeNames, object) {
    if (typeof object !== 'object') {
      return null;
    }
    const member = Object.keys(object).find((member) => {
      return (
        typeof member === 'object'
        && typeNames.contains(member.constructor.name)
      );
    });
    return member;
  }

  getMemberByName(name, object) {
    if (typeof object !== 'object') {
      return null;
    }
    return object[name];
  }

  // eslint-disable-next-line complexity
  combinePath(...parts) {
    if (parts == null || this.isEmpty(parts)) {
      return '';
    } else if (typeof parts === 'string') {
      return parts;
    } else if (Array.isArray(parts)) {
      const first = parts.shift();
      const rest = this.combinePath(...parts);
      if (this.isEmpty(rest)) {
        return first;
      } else if (first.endsWith('/')) {
        if (rest.startsWith('/')) {
          return first + rest.substr(1);
        } else {
          return first + rest;
        }
      } else if (rest.startsWith('/')) {
          return first + rest;
        } else {
          return `${first  }/${  rest}`;
        }
    }
    return '';
  }

  debounce(func, msecs = 2000) {
    let timer = null;
    const debouncer = function () {
      if (timer != null) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        timer = null;
        func();
      }, msecs);
    };
    return debouncer;
  }

  intersect(arr1, arr2, compareFunction = null) {
    const result = [];
    if (arr1 == null || arr1.length == 0 || arr2.length == 0) {
      return result;
    }
    arr1.forEach((item1) => {
      if (
        arr2.find((item2) => {
          if (compareFunction == null) {
            return item1 == item2;
          } else {
            return compareFunction(item1, item2);
          }
        }) != null
      ) {
        result.push(item1);
      }
    });
    return result;
  }

  firstNotEmpty(list) {
    while (list[0] == null) {
      list.shift();
    }
    let result = list[0];
    if (typeof result == 'function') {
      result = result();
    }
    return result;
  }
}

const util = new Util();

export class OptionDef {
  /*
   * name - the key to use in the options Object
   * typeName - a string or array of strings for allowed types
   * a default value if not found
   */
  constructor(name, type, defaultValue) {
    this.name = name;
    this.types = util.toArray(type);
    this.defaultValue = defaultValue;
  }
}
export { util as Util, util };
export default util;
