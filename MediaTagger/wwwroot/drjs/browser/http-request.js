import { Logger } from '../logger.js';
import { util } from '../util.js';

const log = Logger.create('HttpRequest', 0);

export class HttpRequest {
  constructor(baseUrl = null) {
    if (baseUrl == null) {
      baseUrl = './';
    }
    this.baseUrl = baseUrl;
  }

  async get(
    path,
    params = null,
    options = { responseType: 'text', timeout: 10000 }
  ) {
    let responseType = 'text';
    let timeout = 10000;
    if (typeof options == 'object') {
      responseType = options.responseType || 'text';
      timeout = options.timeout || 10000;
    } else if (typeof options == 'string') {
      responseType = options;
    } else if (typeof options == 'number') {
      timeout = options;
    }
    const promise = new Promise((resolve, reject) => {
      let fullPath = path;
      if (fullPath.substr(0, 3) == '://') {
        fullPath = location.protocol + fullPath.substr(1);
      }
      if (fullPath.substr(0, 4) != 'http') {
        fullPath = util.combinePath(this.baseUrl, encodeURI(fullPath));
      }
      fullPath = fullPath + this.encodeParams(params);
      let xhttp = new XMLHttpRequest();
      xhttp.responseType = responseType;
      xhttp.timeout = timeout;
      xhttp.onreadystatechange = () => {
        log.info('GET readyState ', xhttp.readyState, ' ', xhttp.status);

        if (
          xhttp.readyState == 4 &&
          xhttp.status < 300 &&
          xhttp.status >= 200
        ) {
          resolve(xhttp.response);
        } else if (xhttp.readyState == 4) {
          reject(xhttp);
        }
      };
      xhttp.open('GET', fullPath, true);
      xhttp.send();
    });
    const result = await promise;
    return result;
  }

  async delete(path, params = null, responseType = 'text') {
    const promise = new Promise((resolve, reject) => {
      let fullPath = path;
      if (fullPath.substr(0, 3) == '://') {
        fullPath = location.protocol + fullPath.substr(1);
      }
      if (fullPath.substr(0, 4) != 'http') {
        fullPath = util.combinePath(this.baseUrl, encodeURI(fullPath));
      }
      fullPath = fullPath + this.encodeParams(params);
      let xhttp = new XMLHttpRequest();
      xhttp.responseType = responseType;
      xhttp.onreadystatechange = () => {
        log.info('DELETE readyState ', xhttp.readyState, ' ', xhttp.status);
        if (
          xhttp.readyState == 4 &&
          xhttp.status < 300 &&
          xhttp.status >= 200
        ) {
          resolve(xhttp.response);
        } else if (xhttp.readyState == 4) {
          reject(xhttp);
        }
      };
      xhttp.open('DELETE', fullPath, true);
      xhttp.setRequestHeader('Access-Control-Allow-Headers', '*');
      xhttp.setRequestHeader('Access-Control-Allow-Origin', '*');
      xhttp.send();
    });
    const result = await promise;
    return result;
  }

  async post(path, body, responseType = 'text', bodyType = 'application/json') {
    const promise = new Promise((resolve, reject) => {
      let fullPath = path;
      if (fullPath.substr(0, 3) == '://') {
        fullPath = location.protocol + fullPath.substr(1);
      }
      if (fullPath.substr(0, 4) != 'http') {
        fullPath = util.combinePath(this.baseUrl, encodeURI(fullPath));
      }
      if (typeof body == 'object') {
        body = util.toString(body);
      }
      let xhttp = new XMLHttpRequest();
      xhttp.responseType = responseType;
      xhttp.onreadystatechange = () => {
        log.info('POST readyState ', xhttp.readyState, ' ', xhttp.status);

        if (xhttp.readyState == 4 && xhttp.status < 400) {
          resolve(xhttp.response);
        } else if (xhttp.readyState == 4 && xhttp.status >= 400) {
          reject(xhttp);
        }
      };
      xhttp.open('POST', fullPath, true);

      xhttp.setRequestHeader('content-type', bodyType);
      xhttp.send(body);
    });
    const result = await promise;
    return result;
  }
  async put(path, body, responseType = 'text', bodyType = 'application/json') {
    const promise = new Promise((resolve, reject) => {
      let fullPath = path;
      if (fullPath.substr(0, 3) == '://') {
        fullPath = location.protocol + fullPath.substr(1);
      }
      if (fullPath.substr(0, 4) != 'http') {
        fullPath = util.combinePath(this.baseUrl, encodeURI(fullPath));
      }
      if (typeof body == 'object') {
        body = util.toString(body);
      }
      let xhttp = new XMLHttpRequest();
      xhttp.responseType = responseType;
      xhttp.onreadystatechange = () => {
        log.info('PUT readyState ', xhttp.readyState, ' ', xhttp.status);

        if (xhttp.readyState == 4 && xhttp.status < 400) {
          resolve(xhttp.response);
        } else if (xhttp.readyState == 4 && xhttp.status >= 400) {
          reject(xhttp);
        }
      };
      xhttp.open('PUT', fullPath, true);

      xhttp.setRequestHeader('content-type', bodyType);
      xhttp.send(body);
    });
    const result = await promise;
    return result;
  }

  encodeParams(params) {
    if (params == null) {
      return '';
    }
    const pairs = [];
    Object.keys(params).forEach((key) => {
      pairs.push(`${key}=${encodeURIComponent(params[key])}`);
    });
    return `?${pairs.join('&')}`;
  }
}

export const httpRequest = new HttpRequest();
