import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import { ObservableCollection } from "../modules/collections.js";
const log = Logger.create("DataLoader", LOG_LEVEL.DEBUG);

export function dataUpdater(collection, type) {
  function updateBatch(dataArray) {
    var itemStatus = dataArray.reduce(
      (status, data) => {
        var old = collection.findById(data.id);
        if (old) {
          status.toUpdate.push({ item: old, update: data });
        } else {
          status.toAdd.push(new type(data));
        }
        return status;
      },
      { toUpdate: [], toAdd: [] }
    );
    for (var old of itemStatus.toUpdate) {
      old.item.update(old.data);
    }
    collection.insertBatch(itemStatus.toAdd);
  }
  function updateSingle(data) {
    var exists = collection.findById(data.id);
    if (exists) {
      exists.update(data);
      return exists;
    } else {
      var item = new type(data);
      collection.insert(item);
      return item;
    }
  }
  return function update(data) {
    if (Array.isArray(data)) {
      updateBatch(data);
    } else if (data instanceof ObservableCollection) {
      updateBatch(...data);
    } else {
      updateSingle(data);
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
          dataUpdater(response.data);
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
