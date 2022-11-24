import {BaseClient, DomainEvent} from './';
import {StateLoader} from "./StateLoader";
import {Conflict, isSerializedApiError} from "./error";
import {NoRetryStrategy, RetryStrategy} from "./RetryStrategy";

type AggregateType = string;
type AggregateId = string;

export interface AggregatesClientConfig {
  retryStrategy: RetryStrategy
}

export interface AggregateRequest {
  tenantId?: string
  aggregateId: AggregateId,
  expectedVersion: number;
  events: DomainEvent<any>[];
}

export interface AggregateBulkRequest {
  tenantId?: string
  batches: EventBatch[]
}

export interface CreateAggregateOptions {
  tenantId?: string
}

export interface UpdateAggregateOptions {
  tenantId?: string
}

export interface CheckAggregateExistsOptions {
  tenantId?: string
}

export interface LoadAggregateOptions {
  tenantId?: string
  since?: number
  limit?: number
}

export interface DeleteAggregateResponse {
  deleteToken?: string;
}

export interface LoadAggregateResponse {
  aggregateId: AggregateId,
  aggregateVersion: number;
  events: DomainEvent<any>[];
  hasMore: boolean;
}

export interface CheckAggregateExistsRequest {
  aggregateId: AggregateId,
}

export interface DeleteAggregateOptions {
  deleteToken?: boolean;
}

export interface DeleteAggregateRequest {
  aggregateId: AggregateId,
}

export interface DeleteAggregateTypeRequest {
  aggregateType: AggregateType,
}

export interface AggregateMetadata {
  version: number;
}

export interface EventBatch {
  aggregateId: string;
  events: DomainEvent<any>[];
  expectedVersion?: number;
}

class AggregatesClient<A> extends BaseClient {

  private readonly aggregateType: string;
  private readonly stateLoader: StateLoader;
  private readonly aggregateClientConfig: AggregatesClientConfig;

  private static DEFAULT_CONFIG = {
    retryStrategy: new NoRetryStrategy()
  };

  constructor(private aggregateTypeConstructor,
              serializedConfig,
              aggregateClientConfig?: AggregatesClientConfig) {
    super(serializedConfig);
    this.aggregateClientConfig = aggregateClientConfig ?? AggregatesClient.DEFAULT_CONFIG;
    const aggregateTypeInstance = new aggregateTypeConstructor.prototype.constructor({})
    if (!aggregateTypeInstance.aggregateType) {
      throw new Error(`No aggregateType configured for ${aggregateTypeConstructor.prototype.constructor.name}`)
    }
    this.stateLoader = new StateLoader(aggregateTypeConstructor)
    this.aggregateType = aggregateTypeInstance.aggregateType;
  }

  public async exists(request: CheckAggregateExistsRequest, options?: CheckAggregateExistsOptions) {
    const url = AggregatesClient.aggregateUrlPath(this.aggregateType, request.aggregateId);
    try {
      await this.axiosClient.head(url, this.axiosConfig(options?.tenantId));
      return true
    } catch (error) {
      if (isSerializedApiError(error) && error.statusCode === 404) {
        return false
      }
      throw error
    }
  }

  public async save(request: AggregateRequest): Promise<number> {
    const {events, aggregateId, expectedVersion, tenantId} = request
    return await this.saveInternal({aggregateId, events, expectedVersion}, tenantId);
  }

  public async saveBulk(request: AggregateBulkRequest): Promise<number> {
    const {batches, tenantId} = request
    return await this.saveBulkInternal(batches, tenantId);
  }

  public async update(aggregateId: string, commandHandler: (s: A) => DomainEvent<any>[], options?: UpdateAggregateOptions): Promise<number> {
    const tenantId = options?.tenantId
    try {
      return await this.aggregateClientConfig.retryStrategy.executeWithRetries(
          async () => {
            const response = await this.loadInternal(aggregateId, options);
            const currentVersion = response.metadata.version;
            const eventsToSave = commandHandler(response.aggregate);
            return await this.saveInternal({
              aggregateId,
              events: eventsToSave,
              expectedVersion: currentVersion
            }, tenantId);
          }
      )
    } catch (error) {
      if (isSerializedApiError(error)) {
        if (error.statusCode === 409) {
          throw new Conflict(this.aggregateType, aggregateId)
        }
      }
      throw error
    }
  }

  public async bulkUpdate(aggregateIds: string[], commandHandler: (s: A) => DomainEvent<any>[], tenantId?: string): Promise<number> {
    try {
      return await this.aggregateClientConfig.retryStrategy.executeWithRetries(
          async () => {
            let batches = []
            for (const aggregateId of aggregateIds) {
              const response = await this.loadInternal(aggregateId);
              const currentVersion = response.metadata.version;
              const eventsToSave = commandHandler(response.aggregate);
              batches.push({events: eventsToSave, expectedVersion: currentVersion})
            }
            return await this.saveBulkInternal(batches, tenantId);
          }
      )
    } catch (error) {
      if (isSerializedApiError(error)) {
        if (error.statusCode === 409) {
          throw new Conflict(this.aggregateType)
        }
      }
      throw error
    }
  }

  public async bulkSave(batches: EventBatch[], tenantId?: string): Promise<number> {
    try {
      return await this.aggregateClientConfig.retryStrategy.executeWithRetries(
          async () => {
            try {
              return await this.saveBulkInternal(batches, tenantId);
            } catch (e) {
              console.log(e)
            }
          }
      )
    } catch (error) {
      if (isSerializedApiError(error)) {
        if (error.statusCode === 409) {
          throw new Conflict(this.aggregateType)
        }
      }
      throw error
    }
  }

  public async create(aggregateId: string, commandHandler: (s: A) => DomainEvent<any>[], options?: CreateAggregateOptions): Promise<number> {
    const aggregate = new this.aggregateTypeConstructor.prototype.constructor(this.initialState());
    const eventsToSave = commandHandler(aggregate);
    const tenantId = options?.tenantId
    try {
      return await this.aggregateClientConfig.retryStrategy.executeWithRetries(
          async () => {
            return await this.saveInternal({aggregateId, events: eventsToSave, expectedVersion: 0}, tenantId);
          }
      )
    } catch (error) {
      if (isSerializedApiError(error)) {
        if (error.statusCode === 409) {
          throw new Conflict(this.aggregateType, aggregateId)
        }
      }
      throw error
    }
  }

  private async loadInternal(aggregateId: string, options?: LoadAggregateOptions): Promise<{ aggregate, metadata: AggregateMetadata }> {
    const url = `${AggregatesClient.aggregateUrlPath(this.aggregateType, aggregateId)}`;
    const config = options && options.tenantId ? this.axiosConfig(options.tenantId!) : this.axiosConfig();

    const limit = options && options.limit ? options.limit : 1000;
    let since = options && options.since ? options.since : 0;

    const queryParams = new URLSearchParams();
    queryParams.set('since', String(since))
    queryParams.set('limit', String(limit))

    const events = []
    let response: LoadAggregateResponse = null

    do {
      config.params = queryParams;
      const axiosResponse = await this.axiosClient.get(url, config);
      response = axiosResponse.data;
      response.events.forEach(e => events.push(e))
      since += limit
      queryParams.set('since', String(since))
    } while (response.hasMore)

    const currentState = this.stateLoader.loadState(events);

    const aggregate = new this.aggregateTypeConstructor.prototype.constructor(currentState);
    const metadata = {version: response.aggregateVersion};
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

  private async saveBulkInternal(batches: EventBatch[], tenantId?: string): Promise<number> {
    const config = tenantId ? this.axiosConfig(tenantId!) : this.axiosConfig();
    if (batches.length === 0) {
      return 0
    }
    const url = `${AggregatesClient.aggregateTypeBulkEventsUrlPath(this.aggregateType)}`;
    await this.axiosClient.post(url, {batches}, config);
    return batches.flatMap(b => b.events).length
  }

  private async saveInternal(eventBatch: EventBatch, tenantId?: string): Promise<number> {
    const config = tenantId ? this.axiosConfig(tenantId!) : this.axiosConfig();
    const {events, aggregateId, expectedVersion} = eventBatch
    if (events.length === 0) {
      return 0
    }
    await this.axiosClient.post(AggregatesClient.aggregateEventsUrlPath(this.aggregateType, aggregateId), {
      events,
      expectedVersion
    }, config);
    return events.length
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

  public static aggregateTypeEventsUrlPath(aggregateType: string) {
    return `/aggregates/${aggregateType}`;
  }

  public static aggregateTypeBulkEventsUrlPath(aggregateType: string) {
    return `/aggregates/${aggregateType}/events`;
  }

  get initialState() {
    let aggregateTypeInstance = new this.aggregateTypeConstructor.prototype.constructor({});
    return aggregateTypeInstance.initialState ? aggregateTypeInstance.initialState : {};
  }

}

export {AggregatesClient}
