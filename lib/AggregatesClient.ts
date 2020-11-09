import {BaseClient, DomainEvent, EventEnvelope} from './';
import {StateLoader} from "./StateLoader";

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
  events: EventEnvelope<DomainEvent>[];
  expectedVersion?: number;
  encryptedData?: string;
}

class AggregatesClient<A> extends BaseClient {

  private readonly aggregateType: string;
  private readonly initialState: any;
  private readonly stateLoader: StateLoader;

  constructor(private aggregateTypeConstructor, config) {
    super(config);
    let aggregateTypeInstance = new aggregateTypeConstructor.prototype.constructor({})
    this.stateLoader = new StateLoader(aggregateTypeConstructor)
    this.aggregateType = aggregateTypeInstance.aggregateType;
    this.initialState = aggregateTypeInstance.initialState;
  }

  public async checkExists(request: CheckAggregateExistsRequest) {
    const url = AggregatesClient.aggregateUrlPath(this.aggregateType, request.aggregateId);
    return (await this.axiosClient.head(url, this.axiosConfig())).data;
  }

  public async update(aggregateId: string, commandHandler: (s: A) => DomainEvent[]): Promise<void> {
    const response = await this.loadInternal(aggregateId);
    const currentVersion = response.metadata.version;
    const domainEvents = commandHandler(response.aggregate);
    const eventsToSave = domainEvents.map((e) => (EventEnvelope.fromDomainEvent(e)))
    await this.saveInternal(aggregateId, {events: eventsToSave, expectedVersion: currentVersion});
  }

  public async create(aggregateId: string, commandHandler: (s: A) => DomainEvent[]): Promise<void> {
    const aggregate = new this.aggregateTypeConstructor.prototype.constructor(this.initialState);
    const domainEvents = commandHandler(aggregate);
    const eventsToSave = domainEvents.map((e) => (EventEnvelope.fromDomainEvent(e)))
    await this.saveInternal(aggregateId, {events: eventsToSave, expectedVersion: 0});
  }

  public async commit(aggregateId: string, commandHandler: (s: A) => Commit): Promise<void> {
    const aggregate = new this.aggregateTypeConstructor.prototype.constructor(this.initialState);
    const commit = commandHandler(aggregate);
    await this.saveInternal(aggregateId, commit);
  }

  public async recordEvent(aggregateId: string, event: DomainEvent): Promise<void> {
    return await this.recordEvents(aggregateId, [event]);
  }

  public async recordEvents(aggregateId: string, events: DomainEvent[]): Promise<void> {
    await this.saveInternal(aggregateId, {events: events.map(EventEnvelope.fromDomainEvent)});
  }

  public async load<T extends A>(aggregateId: string): Promise<T> {
    const response = await this.loadInternal(aggregateId);
    return response.aggregate;
  }

  private async loadInternal(aggregateId: string): Promise<{ aggregate, metadata: AggregateMetadata }> {
    const url = `${AggregatesClient.aggregateUrlPath(this.aggregateType, aggregateId)}`;
    const axiosResponse = await this.axiosClient.get(url, this.axiosConfig());
    const data: LoadAggregateResponse = axiosResponse.data;

    const currentState = this.stateLoader.loadState(data.events);

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

  private async saveInternal(aggregateId: string, commit: Commit) {
    const url = `${AggregatesClient.aggregateUrlPath(this.aggregateType, aggregateId)}/events`;
    await this.axiosClient.post(url, commit, this.axiosConfig());
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

export {AggregatesClient}
