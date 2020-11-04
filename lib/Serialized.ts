import {AggregatesClient} from "./AggregatesClient";
import {ProjectionsClient} from './ProjectionsClient'
import {FeedsClient} from './FeedsClient'
import {ReactionsClient} from './ReactionsClient'
import {v4 as uuidv4} from 'uuid';

export interface DomainEvent {
}

export class EventEnvelope<E> {

  public readonly eventId = uuidv4();
  public readonly eventType: string;
  public readonly data: E;
  public readonly encryptedData?: string; // TODO: Implement

  constructor(event: E) {
    this.eventType = event.constructor.name;
    this.data = event;
  }

  static fromDomainEvent<E extends DomainEvent>(event: E) {
    return new EventEnvelope<E>(event)
  }
}

export class SerializedInstance {

  public readonly projections: ProjectionsClient;
  public readonly feeds: FeedsClient;
  public readonly reactions: ReactionsClient;

  constructor(public readonly config, public readonly axiosClient) {
    this.projections = new ProjectionsClient(axiosClient, config);
    this.feeds = new FeedsClient(axiosClient, config);
    this.reactions = new ReactionsClient(axiosClient, config);
  }

  aggregateClient<A>(type, initialState): AggregatesClient<A> {
    const axios = this.axiosClient;
    const config = this.config;
    return new AggregatesClient<A>(type, initialState, axios, config);
  }
}
