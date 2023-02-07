import { LOG_LEVEL } from '../logger-interface.js';
import { Logger } from '../logger.js';

const log = Logger.create('Database', LOG_LEVEL.INFO);

function DBPromise(req) {
  return new Promise(function (resolve, reject) {
    req.oncomplete = () => {
      resolve(true);
    };
    req.onsuccess = () => {
      if (req.result && req.result.value) {
        resolve(req.result.value);
      } else if (req.result) {
        resolve(req.result);
      } else {
        resolve(null);
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
    const transaction = this.store.transaction([this.name], 'readwrite');
    const store = transaction.objectStore(this.name);
    store.put(value);
    return DBPromise(transaction);
  }
  async writeItems(items) {
    const transaction = this.store.transaction([this.name], 'readwrite');
    const store = transaction.objectStore(this.name);
    for (let item of items) {
      store.put(item);
    }
    return DBPromise(transaction);
  }

  async getAll() {
    const transaction = this.store.transaction([this.name], 'readonly');
    const store = transaction.objectStore(this.name);
    return DBPromise(store.getAll());
  }

  async read(key) {
    const transaction = this.store.transaction([this.name], 'readwrite');
    const store = transaction.objectStore(this.name);
    return DBPromise(store.get(key));
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
      let self = this;
      let schema = this.schema;
      log.info('opening indexedDB ', schema.name);
      return new Promise(function (resolve, reject) {
        const req = window.indexedDB.open(schema.name, schema.version);
        req.onupgradeneeded = function (event) {
          log.info('database upgrade needed');
          for (let table of schema.tables) {
            if (typeof table == 'string') {
              if (!this.result.objectStoreNames.contains(table)) {
                req.result.createObjectStore(table);
              }
            } else {
              const name = table.name;
              const keyPath = table.key;
              if (!this.result.objectStoreNames.contains(name)) {
                req.result.createObjectStore(name, { keyPath: keyPath });
              }
            }
          }
          event.target.transaction.oncomplete = function () {
            resolve(req.result);
          };
        };
        req.onsuccess = function (event) {
          log.info('database opened');
          resolve(req.result);
        };
        req.onerror = function (event) {
          log.error('database open failed');
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
