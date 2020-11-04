export function Aggregate(aggregateType: string, stateType, eventHandlersType) {
  return function handlesEventsFor<T extends { new(...args: any[]): {} }>(
      constructor: T
  ) {
    return class extends constructor {
      aggregateType = aggregateType;
      eventHandlers = eventHandlersType.eventHandlers;
    };
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
