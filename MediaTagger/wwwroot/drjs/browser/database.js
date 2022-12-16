// a very simple implementaion of indexDB to get & set of name/value pairs
// it could be simpler but has the start of a more complete DB implementation
import assert from "../assert.js";
import { LOG_LEVEL } from "../logger-interface.js";
import Logger from "../logger.js";
import util from "../util.js";
import componentLoader from "./component-loader.js";
import { default as dom, DOM } from "./dom.js";
import { EventEmitter, ObjectEventType } from "./event.js";

const log = Logger.create("Database", LOG_LEVEL.INFO);

function DBPromise(req) {
  return new Promise(function (resolve, reject) {
    req.oncomplete = () => {
      resolve(true);
    };
    req.onsuccess = () => {
      resolve(req ? (req.result ? req.result.value : req.result) : req);
    };
    req.onerror = () => {
      reject(req.result);
    };
  });
}

class Table {
  constructor(name, store) {
    this.name = name;
    this.store = store;
  }

  async set(key, value) {
    const transaction = this.store.transaction([this.name], "readwrite");
    const record = { key: key, value: value };
    const store = transaction.objectStore(this.name);
    store.put(record);
    return DBPromise(transaction);
  }

  async get(key) {
    try {
      const transaction = this.store.transaction([this.name], "readwrite");
      const store = transaction.objectStore(this.name);
      const result = await store.get(key);
      return DBPromise(result);
    } catch (ex) {
      log.error(ex, `failed to read ${key} in table ${this.name}`);
      return null;
    }
  }

  valueToJson(value) {
    return util.toString(value);
  }

  parseJsonValue(val) {
    return JSON.parse(val);
  }
}

export class Database {
  constructor(name = "simple store", version, tables) {
    this.name = name;
    this.version = version;
    this.tables = tables;
    this.indexedDB = null;
  }

  async getDB() {
    if (this.indexedDB == null) {
      var self = this;
      return new Promise(function (resolve, reject) {
        const req = window.indexedDB.open(self.name, self.version);
        req.onupgradeneeded = function (event) {
          log.warn("database upgrade needed");
          for (var table of self.tables) {
            req.result.createObjectStore(table, { keyPath: "key" });
          }
          event.target.transaction.oncomplete = function () {
            resolve(req.result);
          };
        };
        req.onsuccess = function (event) {
          log.warn("database opened");
          resolve(req.result);
        };
        req.onerror = function (event) {
          log.error("database open failed");
          reject(req.result);
        };
      });
    }
    return this.indexedDB;
  }

  async getTable(name) {
    const db = await this.getDB();
    return new Table(name, db);
  }
}

export default Database;
