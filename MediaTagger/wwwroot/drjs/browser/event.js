import assert from '../assert.js';
import Logger from '../logger.js';
import util from '../util.js';
import dom from './dom.js';
import DOM from './dom.js';

const log = Logger.create("Event");

export class HandlerResponse {}
export class ResponseStop extends HandlerResponse {}
export class ResponseContinue extends HandlerResponse {}

export class Listeners extends Array {
    constructor(...args) {
        super();
        args.forEach(arg=>{ this.push(arg);});
    }

    remove() {
        this.forEach(listener=>{
            listener.remove();
        });
        length = 0;
    }
}



export class ObjectEventType {
    constructor(name) {
        this.name = name;
    }

    getName() { return this.name;}

}

export class EventHandler {
    constructor(...args) {
        this.eventProcessor = this.eventProcessor.bind(this);
        this.element = dom.getBody();
        this.handlerObject = null;
        this.handlerFunc = null;
        this.typeName = null;
        args.forEach(arg=>{
            if (arg instanceof HTMLElement) {
                this.element = arg;
            } else if (arg instanceof ObjectEventType) {
                this.typeName = arg.name;
            } else if (typeof arg === 'object'){
                this.handlerObject = arg;
            } else if (typeof arg === 'function'){
                this.handlerFunc = arg;
            } else if (typeof arg === 'string') {
                if (this.typeName == null) {
                    this.typeName = arg;
                }
            }

        });
        if (this.element != null && this.typeName != null) {
            this.element.addEventListener(this.typeName,this.eventProcessor);
        } else {
            log.error("EventHandler needs an element and event type. element=",this.element,"  event type=",this.typeName);
        }
    }

    remove() {
        if (this.element) {
            this.element.removeEventListener(this.typeName,this.eventProcessor);
        }
    }
    eventProcessor(event) {
        var result = ResponseContinue;
        var method = null;
        if (this.handlerFunc){
            var func = this.handlerFunc;
            if (this.handlerObject) {
                method = func.bind(this.handlerObject);
            }
            result = ResponseStop;
            method = func;
        } else if (this.handlerObject) {
            method = this.findHandlerMethod(this.handlerObject,this.typeName);
        }

        if (method) {
            result = this.callHandler(method,event);
        }
        if (result == ResponseStop) {
            event.stopPropagation();
            event.preventDefault();
        }
    }

    // allow derived classed to just override this.
    // they can change values or parse the event and pass additional args
    callHandler(method,event) {
        method(event);
    }
    findHandlerMethod(obj, name) {
        if (typeof obj[name] == 'function') {
            return obj[name].bind(obj);
        }
        var lower = name.toLowerCase();
        var onLower = "on"+lower;
        var methodName = Object.getOwnPropertyNames(Object.getPrototypeOf(obj)).find(propName=>{
            var lowerProp = propName.toLowerCase();
            if (lower == lowerProp || onLower == lowerProp) {
                var func = obj[propName];
                if (typeof func == 'function'){
                    return true;
                }
            }
            return false;
        });
        return methodName == null ? null : obj[methodName];
    }
}

export class ClickHandler extends EventHandler {
    constructor(...args){
        super('click',...args);
    }
}

export class EventListener extends EventHandler {
    constructor(objectEventType,...args) {
        super(dom.getBody(),objectEventType,...args);
    }

    callHandler(method,event) {
        const detail = event.detail;
        method(detail.object,detail.data,detail.type);
    }
}

export class ObjectListener extends EventHandler {
    constructor(obj, objectEventType,...args) {
        super(dom.getBody(),objectEventType,...args);
        this.target = obj;
        this.target = args.find(arg=> typeof(arg) == 'object');
    }

    callHandler(method,event) {
        const detail = event.detail;
        if ((this.target == null || this.target == details.object) &&
            (this.typeName == null || this.typeName == "*" || this.typeName == detail.typeName)) {
            method(detail.object,detail.data,detail.type);
        }
    }
}

export class EventEmitter {
    constructor(type,object){
        this.type = type;
        if (type instanceof ObjectEventType) {
            this.typeName = type.getName();
        } else {
            this.typeName = type;
        }
        this.object = object;
    }

    emit(data) {
        const detail = {
            object: this.object,
            data: data,
            typeName: this.typeName,
            type: this.type
        };
        const event = new CustomEvent(this.typeName,{detail: detail});
        dom.getBody().dispatchEvent(event);
    }
}

