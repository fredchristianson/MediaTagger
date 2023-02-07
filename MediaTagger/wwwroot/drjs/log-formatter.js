import Util from './util.js';

export const LOG_MESSAGE_COMPONENTS = {
  DATE: -1,
  TIME: -2,
  LEVEL: -3,
  MODULE: -4,
  MESSAGE: -5
};

export class LogFormatter {
  constructor(components = null, options = null) {
    // this.components = components || LogFormatter.DEFAULT_FORMAT;
    //  this.options = Object.assign({maxLength:null,moduleNameLength:15},options);
    this.components = LogFormatter.DEFAULT_FORMAT;
    this.options = Object.assign(
      { maxLength: 150, moduleNameLength: 15 },
      options
    );
  }

  set MaxLength(length) {
    this.options.maxLength = length;
  }
  setMaxLength(newVal) {
    this.options.maxLength = newVal;
  }

  format(logMessage) {
    let text = this.components.reduce((text, component) => {
      text = text + this.getComponentValue(logMessage, component);
      return text;
    }, '');
    if (this.options.maxLength && text.length > this.options.maxLength) {
      text = text.substr(0, this.options.maxLength - 3) + '...';
    }
    return text;
  }

  getComponentValue(logMessage, component) {
    if (typeof component == 'string') {
      return component;
    } else if (component == LOG_MESSAGE_COMPONENTS.DATE) {
      return this.formatDate(logMessage.time);
    } else if (component == LOG_MESSAGE_COMPONENTS.TIME) {
      return this.formatTime(logMessage.time);
    } else if (component == LOG_MESSAGE_COMPONENTS.LEVEL) {
      return this.formatLogLevel(logMessage.getLogLevelDescription());
    } else if (component == LOG_MESSAGE_COMPONENTS.MODULE) {
      return this.formatModuleName(logMessage.getModuleName());
    } else if (component == LOG_MESSAGE_COMPONENTS.MESSAGE) {
      return this.formatMessageText(logMessage.getParts());
    } else {
      return '--unknown log message component: ' + component + '--';
    }
  }

  formatDate(dateTime) {
    let year = dateTime.getYear() % 100;
    let month = (1 + dateTime.getMonth()).toString().padStart(2, '0');
    let day = dateTime.getDate().toString().padStart(2, '0');

    return month + '/' + day + '/' + year;
  }

  formatTime(dateTime) {
    let hour = dateTime.getHours();
    let minute = dateTime.getMinutes().toString().padStart(2, '0');
    let second = dateTime.getSeconds().toString().padStart(2, '0');
    let fraction = dateTime.getMilliseconds().toString().padStart(3, '0');

    return hour + ':' + minute + ':' + second + '.' + fraction;
  }

  formatLogLevel(level) {
    return level.padEnd(5);
  }

  formatModuleName(name) {
    let len = this.options.moduleNameLength;
    if (len == null) {
      return name;
    }
    let formatted = name.padEnd(len, '-');
    if (formatted.length > len) {
      let keepStart = Math.round(len / 2);
      let keepEnd = Math.floor(len / 2) - 3;
      let first = formatted.substr(0, keepStart);
      let last = formatted.substr(formatted.length - keepEnd);
      formatted = first + '...' + last;
    }
    return formatted;
  }

  formatMessageText(partsArray) {
    let formattedParts = partsArray.map((part) => {
      //return part;
      return Util.toString(part);
    });
    return formattedParts.join(' ');
  }
}

LogFormatter.DEFAULT_FORMAT = [
  LOG_MESSAGE_COMPONENTS.TIME,
  ' - ',
  LOG_MESSAGE_COMPONENTS.LEVEL,
  ': ',
  LOG_MESSAGE_COMPONENTS.MODULE,
  ': ',
  LOG_MESSAGE_COMPONENTS.MESSAGE
];
LogFormatter.LOG_MESSAGE_COMPONENTS = LOG_MESSAGE_COMPONENTS;

export const defaultFormatter = new LogFormatter();
export default LogFormatter;
