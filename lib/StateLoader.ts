import {ConfigurationError, StateLoadingError} from "./error";
import {DomainEvent} from "./Serialized";

class StateLoader {

  private readonly initialState: any;
  private readonly eventHandlers: any;
  private readonly defaultHandler: any;

  constructor(private readonly stateType) {
    let constructor = stateType.prototype.constructor;
    const instance = new constructor({});
    if (!instance.eventHandlers || instance.eventHandlers.length === 0) {
      throw new ConfigurationError(`No event handlers configured for aggregate: ${constructor.name}`)
    }
    this.initialState = instance.initialState ? instance.initialState : {};
    this.eventHandlers = instance.eventHandlers;
    this.defaultHandler = instance.defaultHandler;
  }

  loadState(events: DomainEvent<any>[]) {
    let currentState = this.initialState;
    events.forEach((e) => {
      let eventType = e.eventType;
      const handler = this.eventHandlers[e.eventType];
      if (handler) {
        currentState = handler.call({}, currentState, e);
      } else if (this.defaultHandler) {
        this.defaultHandler.call({}, currentState, e);
      } else {
        throw new StateLoadingError(`Failed to call handler. No match for event ${eventType}`);
      }
    })
    return currentState;
  }

}

export {StateLoader}
