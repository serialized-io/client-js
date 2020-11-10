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
  private readonly stateLoader: StateLoader;

  constructor(private aggregateTypeConstructor, config) {
    super(config);
    const aggregateTypeInstance = new aggregateTypeConstructor.prototype.constructor({})
    if (!aggregateTypeInstance.aggregateType) {
      throw new Error(`No aggregateType configured for ${aggregateTypeConstructor.prototype.constructor.name}`)
    }
    this.stateLoader = new StateLoader(aggregateTypeConstructor)
    this.aggregateType = aggregateTypeInstance.aggregateType;
  }

  public async checkExists(aggregateId: string) {
    const url = AggregatesClient.aggregateUrlPath(this.aggregateType, aggregateId);
    return (await this.axiosClient.head(url, this.axiosConfig())).data;
  }

  public async update(aggregateId: string, handler: (s: A) => DomainEvent[]): Promise<void> {
    const response = await this.loadInternal(aggregateId);
    const currentVersion = response.metadata.version;
    const domainEvents = handler(response.aggregate);
    const eventsToSave = domainEvents.map((e) => (EventEnvelope.fromDomainEvent(e)))
    await this.saveInternal(aggregateId, {events: eventsToSave, expectedVersion: currentVersion});
  }

  public async create(aggregateId: string, handler: (s: A) => DomainEvent[]): Promise<void> {
    const aggregate = new this.aggregateTypeConstructor.prototype.constructor(this.initialState);
    const domainEvents = handler(aggregate);
    const eventsToSave = domainEvents.map((e) => (EventEnvelope.fromDomainEvent(e)))
    await this.saveInternal(aggregateId, {events: eventsToSave, expectedVersion: 0});
  }

  public async commit(aggregateId: string, handler: (s: A) => Commit): Promise<void> {
    const aggregate = new this.aggregateTypeConstructor.prototype.constructor(this.initialState);
    const commit = handler(aggregate);
    await this.saveInternal(aggregateId, commit);
  }

  public async appendOne(aggregateId: string, event: DomainEvent): Promise<void> {
    return await this.append(aggregateId, [event]);
  }

  public async append(aggregateId: string, events: DomainEvent[]): Promise<void> {
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

  get initialState() {
    let aggregateTypeInstance = new this.aggregateTypeConstructor.prototype.constructor({});
    return aggregateTypeInstance.initialState ? aggregateTypeInstance.initialState : {};
  }

}

export {AggregatesClient}
