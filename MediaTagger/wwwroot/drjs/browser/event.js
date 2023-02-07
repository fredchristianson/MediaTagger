import { EventHandlerBuilder } from './event-handler/handler.js';
import { InputHandlerBuilder } from './event-handler/input-handler.js';
import { ClickHandlerBuilder } from './event-handler/click-handler.js';
import { WheelHandlerBuilder } from './event-handler/wheel-handler.js';
import { MouseOverHandlerBuilder } from './event-handler/mouseover-handler.js';
import { ScrollHandlerBuilder } from './event-handler/scroll-handler.js';
import { CheckboxHandlerBuilder } from './event-handler/checkbox-handler.js';
import { MouseHandlerBuilder } from './event-handler/mouse-handler.js';
import { HoverHandlerBuilder } from './event-handler/hover-handler.js';
import {
  DragHandlerBuilder,
  DropHandlerBuilder,
} from './event-handler/drag-handler.js';
export * from './event-handler/listeners.js';
export * from './event-handler/common.js';
export * from './event-handler/custom-events.js';
export * from './event-handler/key-handler.js';

export function BuildHandler(handlerClass) {
  return new EventHandlerBuilder(handlerClass);
}

export function BuildFocusHandler() {
  return new InputHandlerBuilder();
}

export function BuildDragHandler() {
  return new DragHandlerBuilder();
}
export function BuildDropHandler() {
  return new DropHandlerBuilder();
}

export function BuildMouseOverHandler() {
  return new MouseOverHandlerBuilder();
}

export function BuildMouseHandler() {
  return new MouseHandlerBuilder();
}

export function BuildClickHandler() {
  return new ClickHandlerBuilder();
}

export function BuildScrollHandler() {
  return new ScrollHandlerBuilder();
}

export function BuildInputHandler() {
  return new InputHandlerBuilder();
}

export function BuildCheckboxHandler() {
  return new CheckboxHandlerBuilder();
}

export function BuildWheelHandler() {
  return new WheelHandlerBuilder();
}

export function BuildHoverHandler() {
  return new HoverHandlerBuilder();
}

export default {
  BuildCheckboxHandler,
  BuildClickHandler,
  BuildHandler,
  BuildInputHandler,
  BuildMouseHandler,
  BuildMouseOverHandler,
  BuildScrollHandler,
  BuildWheelHandler,
  BuildHoverHandler,
  BuildDragHandler,
  BuildDropHandler,
};
