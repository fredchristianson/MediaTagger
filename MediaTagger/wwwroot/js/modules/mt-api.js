import { LOG_LEVEL, Logger } from '../../drjs/logger.js';
import { HttpRequest } from '../../drjs/browser/http-request.js';
import { MediaFile } from '../data/media-file.js';
import { Album } from '../data/album.js';
import { Tag } from '../data/tag.js';

const log = Logger.create('MTApi', LOG_LEVEL.WARN);
const httpAPI = new HttpRequest('/api/v1');

export async function getMediaFiles(startPos, count) {
  return await httpAPI.get(
    'MediaFiles',
    { start: startPos, count: count },
    'json'
  );
}

export async function getTags(startPos, count) {
  return await httpAPI.get('Tags', { start: startPos, count: count }, 'json');
}

export async function createTag(parentId, name) {
  let url = 'Tag/?name=' + name;
  if (parentId != null) {
    url += '&parentId=' + parentId;
  }
  let result = await httpAPI.put(url, null, 'json');
  if (result != null && result.success) {
    return new Tag(result.data);
  }
  return null;
}

export async function updateTag(tag) {
  let url = 'Tag';
  let data = {
    id: tag.getId(),
    name: tag.getName(),
    hidden: tag.getHidden(),
    parentId: tag.ParentId
  };
  let result = await httpAPI.post(url, data, 'json');
  if (result != null) {
    return new Tag(result);
  }
  return null;
}

export async function createAlbum(name, description) {
  let url = 'Album';

  let model = {
    name: name,
    description: description
  };
  let result = await httpAPI.put(url, model, 'json');
  if (result != null && result.success) {
    return new Album(result.data);
  } else {
    throw result;
  }
}

export async function updateAlbum(parentId, Album) {
  let url = 'Album';
  if (parentId != null) {
    url += '?parentId=' + parentId;
  }
  let data = {
    id: Album.getId(),
    name: Album.getName(),
    hidden: Album.getHidden(),
    parentId: Album.getParentId
  };
  let result = await httpAPI.put(url, data, 'json');
  if (result != null) {
    return new Album(result);
  }
  return null;
}

export async function getMediaTags(startPos, count) {
  return await httpAPI.get(
    'MediaTags',
    { start: startPos, count: count },
    'json'
  );
}

export async function addMediaTag(mediaFileId, tagId) {
  let url = `MediaTag?mediaFileId=${mediaFileId}&tagId=${tagId}`;
  let result = await httpAPI.put(url, null, 'json');
  if (result == null || !result.success) {
    log.error('failed to add media tag to file');
  }
  return result != null && result.success;
}
export async function removeMediaTag(mediaFileId, tagId) {
  let url = `MediaTag?mediaFileId=${mediaFileId}&tagId=${tagId}`;

  let result = await httpAPI.delete(url, null, 'json');
  if (result == null || !result.success) {
    log.error('failed to remove media tag from file');
  }

  return result != null && result.success;
}

export async function getMediaAlbums(startPos, count) {
  return await httpAPI.get(
    'MediaAlbums',
    { start: startPos, count: count },
    'json'
  );
}

export async function addMediaAlbum(mediaFileId, albumId) {
  let url = `MediaAlbum?mediaFileId=${mediaFileId}&albumId=${albumId}`;

  let result = await httpAPI.put(url, null, 'json');
  if (result == null || !result.success) {
    log.error('failed to add album  to file');
  }

  return result != null && result.success;
}
export async function removeMediaAlbum(mediaFileId, albumId) {
  let url = `MediaAlbum?mediaFileId=${mediaFileId}&albumId=${albumId}`;

  let result = await httpAPI.delete(url, null, 'json');
  if (result == null || !result.success) {
    log.error('failed to add album to file');
  }

  return result != null && result.success;
}

export async function getProperties(startPos, count) {
  return await httpAPI.get(
    'Properties',
    { start: startPos, count: count },
    'json'
  );
}

export async function getPropertyValues(startPos, count) {
  return await httpAPI.get(
    'PropertyValues',
    { start: startPos, count: count },
    'json'
  );
}

export async function getAlbums(startPos, count) {
  return await httpAPI.get('Albums', { start: startPos, count: count }, 'json');
}

export async function saveMediaFiles(updates) {
  for (let update of updates) {
    let data = MediaFile.toJson(update);
    try {
      delete data.fileModifiedOn;
      delete data.fileCreatedOn;
      delete data.fileSize;
      delete data.filename;
      delete data.directory;
      let response = await httpAPI.post('MediaFile', data, 'json');
      log.info('updated ', update.getId());
    } catch (ex) {
      log.error(ex, 'failed to save file ', update.getId());
    }
  }
}

export async function getTopFolders() {
  let response = await httpAPI.get('filesystem/folders', null, 'json');
  return response;
}

export async function getFolders(parent) {
  let response = await httpAPI.get(
    'filesystem/folders/children',
    { parent: encodeURIComponent(parent) },
    'json'
  );
  return response;
}

export async function getAppSettings() {
  let response = await httpAPI.get('settings/app', null, 'json');
  return response;
}

export async function postAppSettings(settings) {
  let response = await httpAPI.post('settings/app', settings, 'json');
  return response;
}

export default 'MediaTagger API functions';
