import {LogWriter} from './log-writer.js';
import {LOG_LEVEL, LogMessage} from './log-message.js';

export class ConsoleLogWriter extends LogWriter {
    constructor(...options) {
        super(options);
    }

    write(text,logMessage) {
        const level = logMessage.getLevel().value;
        const err = logMessage.parts.find(p=> p instanceof Error);
        if (level > LOG_LEVEL.INFO.value) {
            console.log(text);
        } else if (level > LOG_LEVEL.WARN.value) {
            console.log(text);
        } else if (level > LOG_LEVEL.ERROR.value) {
            console.warn(text);
        } else {
            console.warn(text);
            if (err) {
                console.error(err);
            }
        }

    }
}

export default ConsoleLogWriter;