import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import { Listeners } from "../../drjs/browser/event.js";
import UTIL from "../../drjs/util.js";

const log = Logger.create("Media", LOG_LEVEL.INFO);
import api from "../mt-api.js";

class Media {
    constructor() {
        this.items = [];
        this.files = [];
        this.groups = [];
        getAll();
    }

    async getAll() {
        
    }

}

const media = new Media();

export default media;
