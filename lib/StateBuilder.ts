import {DomainEvent} from "./AggregatesClient";

type EventHandlers<S, Events extends { eventType: string }> = {
  [E in Events as `apply${E["eventType"]}`]?: (currentState: S, event: E) => S;
}

/**
 * Builder of aggregate state.
 *
 * Implements apply methods for all events that are relevant to the aggregate.
 *
 * This type also contains methods for a fallback default handler and initial state for the aggregate.
 */
type StateBuilder<S, Events extends { eventType: string }> = {

  /**
   * Initial state of the aggregate.
   *
   * Should return a map of the initial state of the aggregate (e.g. {orderId: null, status: 'UNDEFINED'}).
   */
  initialState: () => S;

  /**
   * Default handler for events that are not handled by the state builder.
   *
   * Typically this is used to handle events that are no longer relevant to the aggregate but are still stored in the event store.
   * If this is not provided, the state builder will throw an error when an unsupported event is loaded.
   *
   * @param e the loaded event
   */
  defaultHandler?: (currentState: S, e: DomainEvent<string, any>) => S;

} & EventHandlers<S, Events>

export {StateBuilder}
