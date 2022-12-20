import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import { ObservableCollection } from "../modules/collections.js";
import { MediaFile } from "./media-file.js";
import { Database } from "../../drjs/browser/database.js";
const log = Logger.create("MediaTaggerDatabase", LOG_LEVEL.DEBUG);

const MEDIAFILE_TABLE = "media-files";
const ALBUM_TABLE = "albums";

const MEDIATAGGER_SCHEMA = {
  name: "media-tagger",
  version: 1,
  tables: [{ name: MEDIAFILE_TABLE, key: "id" }, ALBUM_TABLE],
};
const mediaTaggerDB = new Database(MEDIATAGGER_SCHEMA);

export async function dbSaveMediaFile(file) {
  if (file == null) {
    log.error("saving null MediaFile");
    return;
  }
  if (!file.isUpdated()) {
    return;
  }
  const table = await mediaTaggerDB.getTable(MEDIAFILE_TABLE);
  const data = MediaFile.toJson(file);
  if (data == null) {
    log.error("file is not a MediaFile object");
  }
  try {
    await table.write(data);
    file.unsetChanged();
  } catch (ex) {
    log.error(ex, "failed to write MediaFile to indexedDB", data);
  }
}

export async function dbSaveMediaFiles(files) {
  if (files == null) {
    log.error("saving null MediaFile");
    return;
  }
  if (files.length == 0) {
    return;
  }

  const table = await mediaTaggerDB.getTable(MEDIAFILE_TABLE);
  const data = files.map((file) => {
    return MediaFile.toJson(file);
  });
  try {
    await table.writeItems(data);
    for (var file of files) {
      file.unsetChanged();
    }
  } catch (ex) {
    log.error(ex, "failed to write MediaFile to indexedDB", data);
  }
}

export async function dbGetMediaFiles(startPos, count) {
  var files = [];
  const table = await mediaTaggerDB.getTable(MEDIAFILE_TABLE);
  files = await table.getAll();

  var batch = files.slice(startPos, startPos + count);
  for (var b of batch) {
    b._updated = false;
  }
  return {
    start: startPos,
    requestCount: count,
    totalCount: files.length,
    resultCount: batch.length,
    data: batch,
  };
}
