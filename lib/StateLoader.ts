import {StateBuilder} from "./StateBuilder";
import {UnhandledEventTypeError} from "./error";

/**
 * State builder for an aggregate.
 *
 * Loads the current state of an aggregate based on from the events that have been stored in the aggregate.
 */
export class StateLoader<S, E extends { eventType: string }> {
  loadState(currentState: S, stateBuilder: StateBuilder<S, E>, events: E[]) {
    events.forEach(e => {
      const eventType = e.eventType;
      const eventHandler = stateBuilder[`apply${eventType}`];
      if (!eventHandler) {
        if (stateBuilder.defaultHandler) {
          stateBuilder.defaultHandler(currentState, e)
        } else {
          throw new UnhandledEventTypeError(eventType)
        }
      } else {
        currentState = eventHandler(currentState, e)
      }
    })
    return currentState;
  }
}
