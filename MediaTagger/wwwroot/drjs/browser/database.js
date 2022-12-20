import { LOG_LEVEL } from "../logger-interface.js";
import Logger from "../logger.js";

const log = Logger.create("Database", LOG_LEVEL.INFO);

function DBPromise(req) {
  return new Promise(function (resolve, reject) {
    req.oncomplete = () => {
      resolve(true);
    };
    req.onsuccess = () => {
      if (req.result.value) {
        resolve(req.result.value);
      } else if (req.result) {
        resolve(req.result);
      } else {
        resolve(req);
      }
      
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

  async write(value) {
    const transaction = this.store.transaction([this.name], "readwrite");
    const store = transaction.objectStore(this.name);
    store.put(value);
    return DBPromise(transaction);
  }

  async getAll() {
    const transaction = this.store.transaction([this.name], "readonly");
    const store = transaction.objectStore(this.name);
    return DBPromise(store.getAll());
  }

  async read(key) {
    const transaction = this.store.transaction([this.name], "readwrite");
    const store = transaction.objectStore(this.name);
    store.get(key);
    return DBPromise(transaction);
  }
}

export class Database {
  constructor(schema) {
    this.schema = schema;
    this.indexedDB = null;
    this.openResult = this.getDB();
  }

  async getDB() {
    if (this.indexedDB == null) {
      var self = this;
      var schema = this.schema;
      log.info("opening indexedDB ", schema.name);
      return new Promise(function (resolve, reject) {
        const req = window.indexedDB.open(schema.name, schema.version);
        req.onupgradeneeded = function (event) {
          log.info("database upgrade needed");
          for (var table of schema.tables) {
            if (typeof table == "string") {
              req.result.createObjectStore(table);
            } else {
              const name = table.name;
              const keyPath = table.key;
              req.result.createObjectStore(name, { keyPath: keyPath });
            }
          }
          event.target.transaction.oncomplete = function () {
            resolve(req.result);
          };
        };
        req.onsuccess = function (event) {
          log.info("database opened");
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
    const db = await this.openResult;
    return new Table(name, db);
  }
}

export default Database;
