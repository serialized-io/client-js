import {BaseClient, DomainEvent} from './';
import {StateLoader} from "./StateLoader";
import {Conflict, isSerializedApiError} from "./error";
import {NoRetryStrategy, RetryStrategy} from "./RetryStrategy";

type AggregateType = string;
type AggregateId = string;

export interface AggregatesClientConfig {
  retryStrategy: RetryStrategy
}

export interface RequestOptions {
  tenantId?: string
}

interface AggregateMetadata {
  uniqueness: Uniqueness
}

export interface SaveOptions extends WriteOptions {
  tenantId?: string
  metadata?: AggregateMetadata
}

export interface WriteOptions {
  tenantId?: string
}

export interface AggregateRequest {
  aggregateId: AggregateId,
}

interface LoadAggregateOptions {
  tenantId?: string
  since?: number
  limit?: number
}

interface Uniqueness {
  fields: string[]
}

export interface DeleteAggregateResponse {
  deleteToken?: string;
}

export interface LoadAggregateResponse extends AggregateRequest {
  aggregateVersion: number;
  events: DomainEvent<any>[];
  hasMore: boolean;
}

export interface CheckAggregateExistsRequest extends AggregateRequest {
}

export interface DeleteAggregateOptions extends WriteOptions {
  deleteToken?: boolean;
}

export interface DeleteAggregateTypeRequest {
  aggregateType: AggregateType,
}

export interface EventBatch {
  aggregateId: string;
  events: DomainEvent<any>[];
  expectedVersion?: number;
  metadata?: AggregateMetadata
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

  public async checkExists(request: CheckAggregateExistsRequest) {
    const url = AggregatesClient.aggregateUrlPath(this.aggregateType, request.aggregateId);
    try {
      await this.axiosClient.head(url, this.axiosConfig());
      return true
    } catch (error) {
      if (isSerializedApiError(error) && error.statusCode === 404) {
        return false
      }
      throw error
    }
  }

  public async update(aggregateId: string, commandHandler: (s: A) => DomainEvent<any>[], options?: SaveOptions): Promise<number> {
    try {
      return await this.aggregateClientConfig.retryStrategy.executeWithRetries(
          async () => {
            const response = await this.loadInternal(aggregateId, options);
            const currentVersion = response.aggregateVersion;
            const eventsToSave = commandHandler(response.aggregate);
            return await this.saveInternal({
              aggregateId,
              events: eventsToSave,
              expectedVersion: currentVersion,
              metadata: options?.metadata
            }, options);
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

  public async bulkUpdate(aggregateIds: string[], commandHandler: (s: A) => DomainEvent<any>[], options?: SaveOptions): Promise<number> {
    try {
      return await this.aggregateClientConfig.retryStrategy.executeWithRetries(
          async () => {
            let batches = []
            for (const aggregateId of aggregateIds) {
              const response = await this.loadInternal(aggregateId);
              const currentVersion = response.aggregateVersion;
              const eventsToSave = commandHandler(response.aggregate);
              batches.push({events: eventsToSave, expectedVersion: currentVersion, metadata: options?.metadata})
            }
            return await this.saveBulkInternal(batches, options);
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

  public async bulkSave(batches: EventBatch[], options?: WriteOptions): Promise<number> {
    try {
      return await this.aggregateClientConfig.retryStrategy.executeWithRetries(
          async () => {
            try {
              return await this.saveBulkInternal(batches, options);
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

  public async create(aggregateId: string, commandHandler: (s: A) => DomainEvent<any>[], options?: SaveOptions): Promise<number> {
    const aggregate = new this.aggregateTypeConstructor.prototype.constructor(this.initialState());
    const eventsToSave = commandHandler(aggregate);
    try {
      return await this.aggregateClientConfig.retryStrategy.executeWithRetries(
          async () => {
            return await this.saveInternal({
              aggregateId,
              events: eventsToSave,
              expectedVersion: 0,
              metadata: options?.metadata
            }, options);
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

  public async append({aggregateId, events}: EventBatch, options?: WriteOptions): Promise<number> {
    return await this.saveInternal({aggregateId, events}, options);
  }

  public async deleteAggregate(aggregateId: string, options?: DeleteAggregateOptions): Promise<DeleteAggregateResponse | void> {
    const url = `${AggregatesClient.aggregateUrlPath(this.aggregateType, aggregateId)}`
    let config = this.axiosConfig(options?.tenantId);
    config.params = options;
    return (await this.axiosClient.delete(url, config));
  }

  private async loadInternal(aggregateId: string, options?: LoadAggregateOptions): Promise<{ aggregate, aggregateVersion: number }> {
    const url = `${AggregatesClient.aggregateUrlPath(this.aggregateType, aggregateId)}`;
    const config = this.axiosConfig(options?.tenantId);

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
    const version = response.aggregateVersion
    console.log(`Loaded aggregate ${this.aggregateType}@${aggregateId}:${version}`)
    return {aggregate, aggregateVersion: version};
  }

  public async deleteAggregateType(request: DeleteAggregateTypeRequest, options?: DeleteAggregateOptions): Promise<DeleteAggregateResponse | void> {
    const url = `${AggregatesClient.aggregateTypeUrlPath(request.aggregateType)}`
    let config = this.axiosConfig(options?.tenantId);
    config.params = options;
    return (await this.axiosClient.delete(url, config));
  }

  private async saveBulkInternal(batches: EventBatch[], options?: RequestOptions): Promise<number> {
    const config = this.axiosConfig(options?.tenantId);
    if (batches.length === 0) {
      return 0
    }
    const url = `${AggregatesClient.aggregateTypeEventsUrlPath(this.aggregateType)}`;
    await this.axiosClient.post(url, {batches}, config);
    return batches.flatMap(b => b.events).length
  }

  private async saveInternal(eventBatch: EventBatch, options?: RequestOptions): Promise<number> {
    const config = this.axiosConfig(options?.tenantId);
    if (eventBatch.events.length === 0) {
      return 0
    }
    const url = `${AggregatesClient.aggregateUrlPath(this.aggregateType, eventBatch.aggregateId)}/events`;
    await this.axiosClient.post(url, {
      events: eventBatch.events,
      expectedVersion: eventBatch.expectedVersion,
      metadata: eventBatch.metadata
    }, config);
    return eventBatch.events.length
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

  get initialState() {
    let aggregateTypeInstance = new this.aggregateTypeConstructor.prototype.constructor({});
    return aggregateTypeInstance.initialState ? aggregateTypeInstance.initialState : {};
  }

}

export {AggregatesClient}
