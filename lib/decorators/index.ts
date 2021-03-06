export function Aggregate(aggregateType: string, eventHandlersType) {
  return function handlesEventsFor<T extends { new(...args: any[]): {} }>(constructor: T) {
    let proxy: T
    try {
      proxy = new Function('constructor', 'aggregateType', 'eventHandlersType', `
        'use strict';
        return class extends constructor {
            aggregateType = aggregateType;
            initialState = eventHandlersType.prototype.initialState;
            eventHandlers = eventHandlersType.eventHandlers;
            defaultHandler = eventHandlersType.defaultHandler;
        };
    `)(constructor, aggregateType, eventHandlersType);
    } catch {
      proxy = class extends constructor {
        aggregateType = aggregateType;
        initialState = eventHandlersType.prototype.initialState;
        eventHandlers = eventHandlersType.eventHandlers;
        defaultHandler = eventHandlersType.defaultHandler;
      }
    }
    return proxy;
  }
}

export function EventHandler(type) {
  return function (
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
  ) {
    if (!target.constructor.eventHandlers) {
      target.constructor.eventHandlers = {};
    }
    target.constructor.eventHandlers[type.name] = descriptor.value;
  };
}

export function DefaultHandler() {
  return function (
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
  ) {
    target.constructor.defaultHandler = descriptor.value;
  };
}
