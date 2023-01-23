import { LOG_LEVEL, Logger } from '../../drjs/logger.js';
import { MediaFile } from './media-file.js';
import { Database } from '../../drjs/browser/database.js';
const log = Logger.create('MediaTaggerDatabase', LOG_LEVEL.DEBUG);

const MEDIAFILE_TABLE = 'media-files';
const ALBUM_TABLE = 'albums';
const SETTINGS_TABLE = 'settings';

const MEDIATAGGER_SCHEMA = {
  name: 'media-tagger',
  version: 2,
  tables: [
    { name: MEDIAFILE_TABLE, key: 'id' },
    ALBUM_TABLE,
    { name: SETTINGS_TABLE, key: 'scope' }
  ]
};
const mediaTaggerDB = new Database(MEDIATAGGER_SCHEMA);

export async function dbSaveMediaFile(file) {
  if (file == null) {
    log.error('saving null MediaFile');
    return;
  }
  if (!file.isUpdated()) {
    return;
  }
  const table = await mediaTaggerDB.getTable(MEDIAFILE_TABLE);
  const data = MediaFile.toJson(file);
  if (data == null) {
    log.error('file is not a MediaFile object');
  }
  try {
    await table.write(data);
    file.unsetChanged();
  } catch (ex) {
    log.error(ex, 'failed to write MediaFile to indexedDB', data);
  }
}

export async function dbSaveMediaFiles(files) {
  if (files == null) {
    log.error('saving null MediaFile');
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
  } catch (ex) {
    log.error(ex, 'failed to write MediaFile to indexedDB', data);
  }
}

export async function dbGetMediaFiles(startPos, count) {
  let files = [];
  const table = await mediaTaggerDB.getTable(MEDIAFILE_TABLE);
  files = await table.getAll();

  let batch = files.slice(startPos, startPos + count);
  for (let b of batch) {
    b._updated = false;
  }
  return {
    start: startPos,
    requestCount: count,
    totalCount: files.length,
    resultCount: batch.length,
    data: batch
  };
}

export async function dbLoadSettings(scope) {
  const table = await mediaTaggerDB.getTable(SETTINGS_TABLE);
  const json = await table.read(scope);
  return json;
}

export async function dbSaveSettings(settings) {
  const table = await mediaTaggerDB.getTable(SETTINGS_TABLE);
  const data = settings.toJson();
  try {
    await table.write(data);
  } catch (ex) {
    log.error(ex, 'failed to write settings to indexedDB', data);
  }
}
