import ENV from "../../drjs/env.js";
import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import { HttpRequest } from "../../drjs/browser/http-request.js";
import util from "../../drjs/util.js";
import MediaFile from "../data/media-file.js";
import { Tag, MediaTag } from "../data/tag.js";
import media from "./media.js";

const log = Logger.create("MTApi", LOG_LEVEL.DEBUG);
const httpAPI = new HttpRequest("/api/v1");

export async function getMediaFiles(startPos, count) {
  return await httpAPI.get(
    "MediaFiles",
    { start: startPos, count: count },
    "json"
  );
}

export async function getTags(startPos, count) {
  return await httpAPI.get("Tags", { start: startPos, count: count }, "json");
}

export async function createTag(parentId, name) {
  var url = "Tag/" + name;
  if (parentId != null) {
    url += "?parentId=" + parentId;
  }
  var result = await httpAPI.post(url, null, "json");
  if (result != null) {
    return new Tag(result);
  }
  return null;
}

export async function getMediaTags(startPos, count) {
  return await httpAPI.get(
    "MediaTags",
    { start: startPos, count: count },
    "json"
  );
}

export async function addMediaTag(mediaFileId, tagId) {
  var url = `MediaTag?mediaFileId=${mediaFileId}&tagId=${tagId}`;

  var result = await httpAPI.post(url, null, "json");
  return result != null && result.success;
}
export async function removeMediaTag(mediaFileId, tagId) {
  var url = `MediaTag?mediaFileId=${mediaFileId}&tagId=${tagId}`;

  var result = await httpAPI.delete(url, null, "json");
  return result != null && result.success;
}

export async function getProperties(startPos, count) {
  return await httpAPI.get(
    "Properties",
    { start: startPos, count: count },
    "json"
  );
}

export async function getPropertyValues(startPos, count) {
  return await httpAPI.get(
    "PropertyValues",
    { start: startPos, count: count },
    "json"
  );
}

export async function getAlbums(startPos, count) {
  return await httpAPI.get("Albums", { start: startPos, count: count }, "json");
}

export async function saveMediaFiles(updates) {
  for (var update of updates) {
    var data = MediaFile.toJson(update);
    try {
      delete data.fileModifiedOn;
      delete data.fileCreatedOn;
      delete data.fileSize;
      delete data.filename;
      delete data.directory;
      var response = await httpAPI.post("MediaFile", data, "json");
      log.info("updated ", update.getId());
    } catch (ex) {
      log.error(ex, "failed to save file ", update.getId());
    }
  }
}

export async function getTopFolders() {
  var response = await httpAPI.get("filesystem/folders", null, "json");
  return response;
}

export async function getFolders(parent) {
  var response = await httpAPI.get(
    "filesystem/folders/children",
    { parent: encodeURIComponent(parent) },
    "json"
  );
  return response;
}

export async function getAppSettings() {
  var response = await httpAPI.get("settings/app", null, "json");
  return response;
}

export async function postAppSettings(settings) {
  var response = await httpAPI.post("settings/app", settings, "json");
  return response;
}

export default "MediaTagger API functions";
