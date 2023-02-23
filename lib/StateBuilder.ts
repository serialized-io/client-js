type EventHandlers<S, Events extends { eventType: string }> = {
  [E in Events as `apply${E["eventType"]}`]: (currentState: S, event: E) => S;
}

type StateBuilder<S, Events extends { eventType: string }> = {

  initialState: () => S;

} & EventHandlers<S, Events>

export {StateBuilder}
