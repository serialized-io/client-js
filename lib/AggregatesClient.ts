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

export interface Commit {
  events: DomainEvent[];
  encryptedData?: string;
}

export class AggregatesClient<A> extends BaseClient {

  private readonly aggregateType: string;
  private readonly eventHandlers: Map<string, Function>;
  private readonly initialState: any;

  constructor(private aggregateTypeConstructor, config) {
    super(config);
    let aggregateTypeInstance = new aggregateTypeConstructor.prototype.constructor({})
    this.aggregateType = aggregateTypeInstance.aggregateType;
    this.initialState = aggregateTypeInstance.initialState;
    this.eventHandlers = aggregateTypeInstance.eventHandlers;
  }

  public async checkExists(request: CheckAggregateExistsRequest) {
    const url = AggregatesClient.aggregateUrlPath(this.aggregateType, request.aggregateId);
    return (await this.axiosClient.head(url, this.axiosConfig())).data;
  }

  public async update(aggregateId: string, commandHandler: (s: A) => Commit): Promise<void> {
    const response = await this.loadInternal(aggregateId);
    const eventsToSave = commandHandler(response.aggregate);
    await this.saveInternal(aggregateId, eventsToSave, {expectedVersion: response.metadata.version});
  }

  public async create(aggregateId: string, commandHandler: (s: A) => Commit): Promise<void> {
    const aggregate = new this.aggregateTypeConstructor.prototype.constructor(this.initialState);
    const eventsToSave = commandHandler(aggregate);
    await this.saveInternal(aggregateId, eventsToSave, {expectedVersion: 0});
  }

  public async storeEvent(aggregateId: string, event: DomainEvent, options?: StoreEventsOptions): Promise<void> {
    await this.storeEvents(aggregateId, {events: [event]}, options);
  }

  public async storeEvents(aggregateId: string, commit: Commit, options?: StoreEventsOptions): Promise<void> {
    await this.saveInternal(aggregateId, commit, options);
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

  private async saveInternal(aggregateId: string, commit: Commit, options: StoreEventsOptions = {expectedVersion: undefined}) {
    const eventsToSave: EventEnvelope<DomainEvent>[] = commit.events.map((e) => (EventEnvelope.fromDomainEvent(e)));
    let payload;
    if (options.expectedVersion) {
      payload = {
        payloadEvents: eventsToSave,
        expectedVersion: options.expectedVersion,
        encryptedData: commit.encryptedData
      }
    } else {
      payload = {
        events: eventsToSave,
        encryptedData: commit.encryptedData
      };
    }
    const url = `${AggregatesClient.aggregateUrlPath(this.aggregateType, aggregateId)}/events`;
    await this.axiosClient.post(url, payload, this.axiosConfig());
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
