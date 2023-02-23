import {StateBuilder} from "./StateBuilder";

export class StateLoader<S, E extends { eventType: string }> {
  loadState(currentState: S, stateBuilder: StateBuilder<S, E>, events: E[]) {
    events.forEach(e => {
      let eventType = e.eventType;
      currentState = stateBuilder[`apply${eventType}`](currentState, e)
    })
    return currentState;
  }
}
