/**
 * 2021-04-07 by MrSpoocy: Fix issue if you use ES6 or higher (https://github.com/vuex-orm/vuex-orm/commit/25b458bd4de72f64ad4e8b3a3983ace062be8cfd)
 *
 * @param {string} aggregateType
 * @param eventHandlersType
 * @constructor
 */
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
        };
    `)(constructor, aggregateType, eventHandlersType);
    } catch {
      proxy = class extends constructor {
        aggregateType = aggregateType;
        initialState = eventHandlersType.prototype.initialState;
        eventHandlers = eventHandlersType.eventHandlers;
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
