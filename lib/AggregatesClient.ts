import {BaseClient, DomainEvent} from './';
import {StateLoader} from "./StateLoader";
import {Conflict, isSerializedApiError} from "./error";
import {NoRetryStrategy, RetryStrategy} from "./RetryStrategy";

type AggregateId = string;

export interface DeleteToken {
  token: string;
  consumed: boolean;
}

export interface AggregatesClientConfig {
  retryStrategy: RetryStrategy
}

export interface AggregateRequest {
  tenantId?: string
  aggregateId: AggregateId,
  expectedVersion: number;
  events: DomainEvent<any>[];
}

export interface BulkSaveRequest {
  tenantId?: string
  batches: EventBatch[]
}

export interface BulkUpdateRequest {
  tenantId?: string
  aggregateIds: string[]
}

export interface UpdateAggregateRequest {
  aggregateId: AggregateId,
  tenantId?: string
  useOptimisticConcurrency?: boolean
}

export interface CreateAggregateRequest {
  aggregateId: AggregateId,
  tenantId?: string
}

export interface LoadAggregateRequest {
  aggregateId: AggregateId,
  tenantId?: string
  since?: number
  limit?: number
}

export interface LoadAggregateResponse {
  aggregateId: AggregateId,
  aggregateVersion: number;
  events: DomainEvent<any>[];
  hasMore: boolean;
}

export interface CheckAggregateExistsRequest {
  aggregateId: AggregateId,
  tenantId?: string
}

export interface DeleteAggregateOptions {
  aggregateId?: AggregateId
  tenantId?: string
}

export interface ConfirmDeleteAggregateOptions {
  token: string
  aggregateId?: AggregateId
  tenantId?: string
}

export interface AggregateMetadata {
  version: number;
}

export interface EventBatch {
  aggregateId: string;
  events: DomainEvent<any>[];
  expectedVersion?: number;
}

class AggregatesClient extends BaseClient {

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

  public async save(request: AggregateRequest): Promise<number> {
    const {events, aggregateId, expectedVersion, tenantId} = request
    return await this.saveInternal({aggregateId, events, expectedVersion}, tenantId);
  }

  public async update(request: UpdateAggregateRequest, commandHandler: (s) => DomainEvent<any>[]): Promise<number> {
    const tenantId = request?.tenantId
    try {
      return await this.aggregateClientConfig.retryStrategy.executeWithRetries(
          async () => {
            const response = await this.loadInternal(request);
            const currentVersion = response.metadata.version;
            const eventsToSave = commandHandler(response.aggregate);
            return await this.saveInternal({
              aggregateId: request.aggregateId,
              events: eventsToSave,
              expectedVersion: request?.useOptimisticConcurrency === false ? undefined : currentVersion
            }, tenantId);
          }
      )
    } catch (error) {
      if (isSerializedApiError(error)) {
        if (error.statusCode === 409) {
          throw new Conflict(this.aggregateType, request.aggregateId)
        }
      }
      throw error
    }
  }

  public async saveBulk(request: BulkSaveRequest): Promise<number> {
    const {batches, tenantId} = request
    return await this.saveBulkInternal(batches, tenantId);
  }

  public async bulkUpdate(request: BulkUpdateRequest, commandHandler: (s) => DomainEvent<any>[]): Promise<number> {
    try {
      return await this.aggregateClientConfig.retryStrategy.executeWithRetries(
          async () => {
            let batches = []
            for (const aggregateId of request.aggregateIds) {
              const response = await this.loadInternal({aggregateId});
              const currentVersion = response.metadata.version;
              const eventsToSave = commandHandler(response.aggregate);
              batches.push({events: eventsToSave, expectedVersion: currentVersion})
            }
            return await this.saveBulkInternal(batches, request.tenantId);
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
      return await this.aggregateClientConfig.retryStrategy.executeWithRetries(() => this.saveBulkInternal(batches, tenantId))
    } catch (error) {
      if (isSerializedApiError(error)) {
        if (error.statusCode === 409) {
          throw new Conflict(this.aggregateType)
        }
      }
      throw error
    }
  }

  public async create(request: CreateAggregateRequest, commandHandler: (s) => DomainEvent<any>[]): Promise<number> {
    const aggregate = new this.aggregateTypeConstructor.prototype.constructor(this.initialState());
    const eventsToSave = commandHandler(aggregate);
    const tenantId = request?.tenantId
    const aggregateId = request.aggregateId;
    try {
      return await this.aggregateClientConfig.retryStrategy.executeWithRetries(
          () => this.saveInternal({aggregateId, events: eventsToSave, expectedVersion: 0}, tenantId)
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

  public async exists(request: CheckAggregateExistsRequest) {
    const url = AggregatesClient.aggregateUrlPath(this.aggregateType, request.aggregateId);
    try {
      await this.axiosClient.head(url, this.axiosConfig(request.tenantId));
      return true
    } catch (error) {
      if (isSerializedApiError(error) && error.statusCode === 404) {
        return false
      }
      throw error
    }
  }

  public async delete(options?: DeleteAggregateOptions): Promise<DeleteToken> {
    const config = options && options.tenantId ? this.axiosConfig(options.tenantId!) : this.axiosConfig();
    const url = options?.aggregateId ?
        `${AggregatesClient.aggregateUrlPath(this.aggregateType, options.aggregateId)}` :
        `${AggregatesClient.aggregateTypeUrlPath(this.aggregateType)}`
    const response = await this.axiosClient.delete(url, config);
    return response.data;
  }

  private async loadInternal(request: LoadAggregateRequest): Promise<{ aggregate, metadata: AggregateMetadata }> {
    const url = `${AggregatesClient.aggregateUrlPath(this.aggregateType, request.aggregateId)}`;
    const config = request.tenantId ? this.axiosConfig(request.tenantId!) : this.axiosConfig();

    const limit = request.limit ? request.limit : 1000;
    let since = request.since ? request.since : 0;

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
    console.log(`Loaded aggregate ${this.aggregateType}@${request.aggregateId}:${metadata.version}`)
    return {aggregate, metadata};
  }

  public async confirmDelete(options: ConfirmDeleteAggregateOptions): Promise<void> {
    const config = options && options.tenantId ? this.axiosConfig(options.tenantId!) : this.axiosConfig();
    const url = options.aggregateId ?
        `${AggregatesClient.aggregateUrlPath(this.aggregateType, options.aggregateId)}` :
        `${AggregatesClient.aggregateTypeUrlPath(this.aggregateType)}`
    const queryParams = new URLSearchParams();
    if (options.token) {
      queryParams.set('deleteToken', options.token)
    }
    config.params = queryParams;
    await this.axiosClient.delete(url, config);
  }

  private async saveBulkInternal(batches: EventBatch[], tenantId?: string): Promise<number> {
    const config = tenantId ? this.axiosConfig(tenantId!) : this.axiosConfig();
    if (batches.length === 0) {
      return 0
    }
    const url = `${AggregatesClient.aggregateTypeBulkEventsUrlPath(this.aggregateType)}`;
    await this.axiosClient.post(url, {batches}, config);
    const eventCounts = batches.map(b => b.events.length);
    return eventCounts.reduce((sum, current) => (sum + current), 0)
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

  public static aggregateTypeBulkEventsUrlPath(aggregateType: string) {
    return `/aggregates/${aggregateType}/events`;
  }

  get initialState() {
    let aggregateTypeInstance = new this.aggregateTypeConstructor.prototype.constructor({});
    return aggregateTypeInstance.initialState ? aggregateTypeInstance.initialState : {};
  }

}

export {AggregatesClient}
