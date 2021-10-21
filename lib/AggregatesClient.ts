import {BaseClient, DomainEvent, EventEnvelope} from './';
import {StateLoader} from "./StateLoader";
import {AggregateNotFound, Conflict, isSerializedApiError} from "./error";

export interface DeleteAggregateResponse {
  deleteToken?: string;
}

type AggregateType = string;
type AggregateId = string;

export interface CommitOptions {
  tenantId?: string
}

export interface RecordEventOptions {
  tenantId?: string
}

export interface CreateAggregateOptions {
  tenantId?: string
}

export interface LoadAggregateOptions {
  tenantId?: string
  since?: number
  limit?: number
}

export interface AggregateRequest {
  aggregateId: AggregateId,
}

export interface LoadAggregateResponse extends AggregateRequest {
  aggregateVersion: number;
  events: EventEnvelope<DomainEvent>[];
  hasMore: false;
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

  public async checkExists(request: CheckAggregateExistsRequest) {
    const url = AggregatesClient.aggregateUrlPath(this.aggregateType, request.aggregateId);
    return (await this.axiosClient.head(url, this.axiosConfig())).data;
  }

  public async update(aggregateId: string, commandHandler: (s: A) => DomainEvent[]): Promise<number> {
    const response = await this.loadInternal(aggregateId);
    const currentVersion = response.metadata.version;
    const domainEvents = commandHandler(response.aggregate);
    const eventsToSave = domainEvents.map((e) => (EventEnvelope.fromDomainEvent(e)))
    try {
      return await this.saveInternal(aggregateId, {events: eventsToSave, expectedVersion: currentVersion});
    } catch (error) {
      if (isSerializedApiError(error)) {
        if (error.statusCode === 409) {
          throw new Conflict(this.aggregateType, aggregateId, currentVersion)
        }
      }
      throw error
    }
  }

  public async create(aggregateId: string, commandHandler: (s: A) => DomainEvent[], options?: CreateAggregateOptions): Promise<number> {
    const aggregate = new this.aggregateTypeConstructor.prototype.constructor(this.initialState);
    const domainEvents = commandHandler(aggregate);
    const eventsToSave = domainEvents.map((e) => (EventEnvelope.fromDomainEvent(e)))
    const tenantId = options?.tenantId
    try {
      return await this.saveInternal(aggregateId, {events: eventsToSave, expectedVersion: 0}, tenantId);
    } catch (error) {
      if (isSerializedApiError(error)) {
        if (error.statusCode === 409) {
          throw new Conflict(this.aggregateType, aggregateId, 0)
        }
      }
      throw error
    }
  }

  public async commit(aggregateId: string, commandHandler: (s: A) => Commit, options?: CommitOptions): Promise<number> {
    const aggregate = new this.aggregateTypeConstructor.prototype.constructor(this.initialState);
    const commit = commandHandler(aggregate);
    const tenantId = options?.tenantId
    return await this.saveInternal(aggregateId, commit, tenantId);
  }

  public async recordEvent(aggregateId: string, event: DomainEvent, options?: RecordEventOptions): Promise<number> {
    const tenantId = options?.tenantId
    return await this.recordEvents(aggregateId, [event], tenantId);
  }

  public async recordEvents(aggregateId: string, events: DomainEvent[], tenantId?: string): Promise<number> {
    return await this.saveInternal(aggregateId, {events: events.map((e) => EventEnvelope.fromDomainEvent(e))}, tenantId);
  }

  public async load<T extends A>(aggregateId: string, options?: LoadAggregateOptions): Promise<T> {
    try {
      const response = await this.loadInternal(aggregateId, options);
      return response.aggregate;
    } catch (error) {
      if (isSerializedApiError(error)) {
        if (error.statusCode === 404) {
          throw new AggregateNotFound(this.aggregateType, aggregateId);
        }
      }
      throw error;
    }
  }

  private async loadInternal(aggregateId: string, options?: LoadAggregateOptions): Promise<{ aggregate, metadata: AggregateMetadata }> {
    const url = `${AggregatesClient.aggregateUrlPath(this.aggregateType, aggregateId)}`;
    const config = options && options.tenantId ? this.axiosConfig(options.tenantId!) : this.axiosConfig();
    const queryParams = new URLSearchParams();
    if (options) {
      if (options.since) {
        queryParams.set('since', String(options.since))
      }
      if (options.limit) {
        queryParams.set('limit', String(options.limit))
      }
    }
    config.params = queryParams;
    const axiosResponse = await this.axiosClient.get(url, config);
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

  private async saveInternal(aggregateId: string, commit: Commit, tenantId?: string) : Promise<number> {
    const config = tenantId ? this.axiosConfig(tenantId!) : this.axiosConfig();
    if (commit.events.length === 0) {
      return 0
    }
    const url = `${AggregatesClient.aggregateUrlPath(this.aggregateType, aggregateId)}/events`;
    await this.axiosClient.post(url, commit, config);
    return commit.events.length
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
