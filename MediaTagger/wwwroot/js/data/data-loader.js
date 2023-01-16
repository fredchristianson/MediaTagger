import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import { ObservableCollection } from "../modules/collections.js";
const log = Logger.create("DataLoader", LOG_LEVEL.DEBUG);

export function dataAdder(collection, type) {
  function addBatch(dataArray) {
    var itemStatus = dataArray.reduce(
      (status, data) => {
        var old = collection.findById(data.id);
        if (old) {
          status.toUpdate.push({ item: old });
        } else {
          data = new type(data);

          status.toAdd.push(data);
        }
        return status;
      },
      { toUpdate: [], toAdd: [] }
    );
    if (itemStatus.toUpdate.length > 0) {
      log.error("dataAdder found existing data");
    }
    collection.insertBatch(itemStatus.toAdd);
  }
  function addSingle(data) {
    var exists = collection.findById(data.id);
    if (exists) {
      log.error("dataAdder found existing data");
      return exists;
    } else {
      if (data instanceof type) {
        collection.insert(data);
      } else {
        data = new type(data);
        collection.insert(data);
      }
      return data;
    }
  }
  return function update(data) {
    if (Array.isArray(data)) {
      addBatch(data);
    } else if (data instanceof ObservableCollection) {
      addBatch(...data);
    } else {
      addSingle(data);
    }
  };
}

export function dataUpdater(collection, type) {
  function updateBatch(dataArray) {
    var itemStatus = dataArray.reduce(
      (status, data) => {
        var old = collection.findById(data.id);
        if (old) {
          status.toUpdate.push({ item: old, update: data });
        } else {
          if (!(data instanceof type)) {
            data = new type(data);
          }
          status.toAdd.push(data);
        }
        return status;
      },
      { toUpdate: [], toAdd: [] }
    );
    var changed = itemStatus.toUpdate.filter((change) => {
      change.item.update(change.update);
      return change.item.isChanged();
    });
    collection.itemsChanged(changed);
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
          response.totalCount <= pos ||
          response.resultCount == 0;
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
