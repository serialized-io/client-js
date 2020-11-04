import {BaseClient} from './BaseClient'
import {DomainEvent, EventEnvelope} from "./Serialized";

export interface DeleteAggregateResponse {
  deleteToken?: string;
}

type AggregateType = string;
type AggregateId = string;

export interface AggregateRequest {
  aggregateId: AggregateId,
}

export interface LoadAggregateResponse extends AggregateRequest {
  aggregateVersion: number;
  events: EventEnvelope<DomainEvent>[];
  hasMore: false;
}

export interface StoreEventsOptions {
  expectedVersion?: number;
}

export interface CheckAggregateExistsRequest extends AggregateRequest {
}

export interface DeleteAggregateOptions {
  deleteToken?: boolean;
}

export interface DeleteAggregateRequest extends AggregateRequest {
}

export interface DeleteAggregateTypeRequest {
  aggregateType: AggregateType,
}

export interface AggregateMetadata {
  version: number;
}

export class AggregatesClient<A> extends BaseClient {

  private readonly aggregateType: string;
  private readonly eventHandlers: Map<string, Function>;

  constructor(private aggregateTypeConstructor, private initialState, axiosClient, config) {
    super(axiosClient, config);
    let aggregateTypeInstance = new aggregateTypeConstructor.prototype.constructor({})
    this.aggregateType = aggregateTypeInstance.aggregateType;
    this.eventHandlers = aggregateTypeInstance.eventHandlers;
  }

  public async checkExists(request: CheckAggregateExistsRequest) {
    const url = AggregatesClient.aggregateUrlPath(this.aggregateType, request.aggregateId);
    return (await this.axiosClient.head(url, this.axiosConfig())).data;
  }

  public async update(aggregateId: string, commandHandler: (s: A) => DomainEvent[]): Promise<EventEnvelope<DomainEvent>[]> {
    const response = await this.loadInternal(aggregateId);
    const eventsToSave = commandHandler(response.aggregate);
    const savedEvents = await this.saveInternal(aggregateId, eventsToSave, {expectedVersion: response.metadata.version});
    return Promise.resolve(savedEvents);
  }

  public async create(aggregateId: string, commandHandler: (s: A) => DomainEvent[]): Promise<EventEnvelope<DomainEvent>[]> {
    const aggregate = new this.aggregateTypeConstructor.prototype.constructor(this.initialState);
    const eventsToSave = commandHandler(aggregate);
    const savedEvents = await this.saveInternal(aggregateId, eventsToSave, {expectedVersion: 0});
    return Promise.resolve(savedEvents);
  }

  public async storeEvent(aggregateId: string, event: DomainEvent, options?: StoreEventsOptions): Promise<EventEnvelope<DomainEvent>[]> {
    return this.storeEvents(aggregateId, [event], options);
  }

  public async storeEvents(aggregateId: string, events: DomainEvent[], options?: StoreEventsOptions): Promise<EventEnvelope<DomainEvent>[]> {
    const savedEvents = await this.saveInternal(aggregateId, events, options);
    return Promise.resolve(savedEvents);
  }

  public async load<T extends A>(aggregateId: string): Promise<T> {
    const response = await this.loadInternal(aggregateId);
    return response.aggregate;
  }

  private async loadInternal(aggregateId: string): Promise<{ aggregate, metadata: AggregateMetadata }> {
    const url = `${AggregatesClient.aggregateUrlPath(this.aggregateType, aggregateId)}`;
    const axiosResponse = await this.axiosClient.get(url, this.axiosConfig());
    const data: LoadAggregateResponse = axiosResponse.data;

    let currentState = this.initialState;
    data.events.forEach((e) => {
      const handler = this.eventHandlers[e.eventType];
      if (handler) {
        currentState = handler(currentState, e);
      } else {
        return Promise.reject(`Failed to call handler. No match for event ${e.eventType}`);
      }
    })

    const aggregate = new this.aggregateTypeConstructor.prototype.constructor(currentState);
    const metadata = {version: data.aggregateVersion};
    aggregate._metadata = metadata;
    console.log(`Loaded aggregate ${this.aggregateType}@${aggregateId}:${metadata.version}`)
    return {aggregate, metadata};
  }

  public async deleteAggregate(request: DeleteAggregateRequest, options?: DeleteAggregateOptions): Promise<DeleteAggregateResponse | void> {
    const url = `${AggregatesClient.aggregateUrlPath(this.aggregateType, request.aggregateId)}`
    let config = this.axiosConfig();
    config.params = options;
    return (await this.axiosClient.delete(url, config));
  }

  public async deleteAggregateType(request: DeleteAggregateTypeRequest, options?: DeleteAggregateOptions): Promise<DeleteAggregateResponse | void> {
    const url = `${AggregatesClient.aggregateTypeUrlPath(request.aggregateType)}`
    let config = this.axiosConfig();
    config.params = options;
    return (await this.axiosClient.delete(url, config));
  }

  private async saveInternal(aggregateId: string, events: DomainEvent[], options: { expectedVersion?: number } = {expectedVersion: undefined}) {
    let payload;
    const eventsToSave: EventEnvelope<DomainEvent>[] = events.map((e) => (EventEnvelope.fromDomainEvent(e)));
    if (options.expectedVersion) {
      payload = {
        payloadEvents: eventsToSave,
        expectedVersion: options.expectedVersion
      }
    } else {
      payload = {
        events: eventsToSave,
      };
    }
    const url = `${AggregatesClient.aggregateUrlPath(this.aggregateType, aggregateId)}/events`;
    await this.axiosClient.post(url, payload, this.axiosConfig());
    return eventsToSave
  }

  public static aggregateEventsUrlPath(aggregateType: string, aggregateId: string) {
    return `/aggregates/${aggregateType}/${aggregateId}/events`;
  }

  public static aggregateUrlPath(aggregateType: string, aggregateId: string) {
    return `/aggregates/${aggregateType}/${aggregateId}`;
  }

  public static aggregateTypeUrlPath(aggregateType: string) {
    return `/aggregates/${aggregateType}`;
  }

}
