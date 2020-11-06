import {DomainEvent, EventEnvelope} from "../";

class StateLoader {

  constructor(private initialState, private readonly eventHandlers) {
  }

  loadState(events: EventEnvelope<DomainEvent>[]) {
    let currentState = this.initialState;
    events.forEach((e) => {
      let eventType = e.eventType;
      const handler = this.eventHandlers[e.eventType];
      if (handler) {
        currentState = handler(e, currentState);
      } else {
        return Promise.reject(`Failed to call handler. No match for event ${eventType}`);
      }
    })
    return currentState;
  }

}

export {StateLoader}
