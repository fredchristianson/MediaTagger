import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
const log = Logger.create("DataLoader", LOG_LEVEL.DEBUG);

export function dataUpdater(collection, type) {
  return function update(data) {
    var exists = collection.findById(data.id);
    if (exists) {
      exists.update(data);
      return exists;
    } else {
      var item = new type(data);
      collection.insert(item);
      return item;
    }
  };
}

export function dataLoader(source, dataUpdater, batchSize = 1000) {
  return async function () {
    try {
      var pos = 0;
      var done = false;
      while (!done) {
        var response = await source(pos, batchSize);
        done =
          response == null ||
          response.totalCount == null ||
          response.totalCount <= pos;
        if (!done) {
          for (var item of response.data) {
            dataUpdater(item);
          }
          pos = pos + response.resultCount;
        }
      }
    } catch (ex) {
      log.error(ex, "failed to load items");
    }
  };
}

class DataSource {
  constructor() {}
}

class APIDataSource extends DataSource {
  constructor() {
    super();
  }
}

class DataLoader {
  constructor(source, collection) {
    this.source = source;
    this.collection = collection;
  }

  async load(batchSize = 1000) {
    return true;
  }
}

class FileDataLoader extends DataLoader {
  constructor(source, collection) {
    super(source, collection);
  }
}

class GroupDataLoader extends DataLoader {
  constructor(source, collection) {
    super(source, collection);
  }
}

class TagDataLoader extends DataLoader {
  constructor(source, collection) {
    super(source, collection);
  }
}

class PropertyDataLoader extends DataLoader {
  constructor(source, collection) {
    super(source, collection);
  }
}
