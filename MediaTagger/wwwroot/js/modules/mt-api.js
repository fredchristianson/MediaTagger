﻿import ENV from "../../drjs/env.js";
import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import { HttpRequest } from "../../drjs/browser/http-request.js";
import util from "../../drjs/util.js";
import SignalR from "../../drjs/browser/signalr.js";

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

export async function getProperties(startPos, count) {
  return await httpAPI.get(
    "Properties",
    { start: startPos, count: count },
    "json"
  );
}

export async function getPropertyValues(startPos, count) {
  return await httpAPI.get(
    "PropertValues",
    { start: startPos, count: count },
    "json"
  );
}

export async function getAlbums(startPos, count) {
  return await httpAPI.get("Albums", { start: startPos, count: count }, "json");
}

export class MediaTaggerApi {
  constructor() {
    this.http = new HttpRequest("/api/v1");
  }

  initialize() {
    /*
    this.signalr = SignalR.create("/hub/log").build().handle("LogMessage", (message) => log.debug("LogMessage", message))
    .handle("Debug", (message) => log.debug("Debug", message))
    .handle("Log", (message) =>
      log.debug("Log", message)
    );
    this.signalrImage = SignalR.create("/hub/image").build().handle("Update", (message) => log.debug("Update", message));
*/
  }

  async GetAllMediaItems() {
    var items = [];
    var response = await this.http.get("MediaItems", null, "json");
    return response;
  }

  async GetAllMediaFiles() {
    var items = [];
    var response = await this.http.get("MediaFiles", null, "json");
    return response;
  }

  async GetAllMediaGroups() {
    var items = [];
    var response = await this.http.get("MediaGroups", null, "json");
    return response;
  }

  async GetTopFolders() {
    var response = await this.http.get("filesystem/folders", null, "json");
    return response;
  }

  async GetFolders(parent) {
    var response = await this.http.get(
      "filesystem/folders/children",
      { parent: encodeURIComponent(parent) },
      "json"
    );
    return response;
  }

  async GetAppSettings() {
    var response = await this.http.get("settings/app", null, "json");
    return response;
  }

  async PostAppSettings(settings) {
    var response = await this.http.post("settings/app", settings, "json");
    return response;
  }
}

var singleton = new MediaTaggerApi();

export default singleton;