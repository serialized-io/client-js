import {BaseClient, StateBuilder,} from './';
import {Conflict, isSerializedApiError} from "./error";
import {NoRetryStrategy, RetryStrategy} from "./RetryStrategy";
import {StateLoader} from "./StateLoader";

type EventType = string;
type EventData = object
type AggregateId = string;
type TenantId = string;

export type DomainEvent<T extends EventType, D extends EventData> = {
  readonly eventType: T
  readonly data?: D
  readonly eventId?: string
  readonly encryptedData?: string;
}

export type AggregatesClientConfig<T extends EventType> = {
  readonly aggregateType: T
  readonly retryStrategy?: RetryStrategy
}

export type DeleteToken = {
  readonly token: string;
  readonly consumed: boolean;
}

export type AggregateRequest<E> = {
  tenantId?: TenantId
  aggregateId: AggregateId,
  expectedVersion: number;
  events: E[];
}

export type SaveBulkPayload<E> = {
  batches: EventBatch<E>[]
}

export type BulkSaveRequest<E> = {
  tenantId?: TenantId
  batches: EventBatch<E>[]
}

export type BulkUpdateRequest = {
  tenantId?: TenantId
  aggregateIds: string[]
}

export type UpdateAggregateRequest = {
  aggregateId: AggregateId,
  tenantId?: TenantId
  useOptimisticConcurrency?: boolean
}

export type CreateAggregateRequest = {
  aggregateId: AggregateId,
  tenantId?: TenantId
}

export type LoadAggregateRequest = {
  aggregateId: AggregateId,
  tenantId?: TenantId
  since?: number
  limit?: number
}

export type LoadAggregateResponse<E> = {
  aggregateId: AggregateId,
  aggregateVersion: number;
  events: E[];
  hasMore: boolean;
}

export type CheckAggregateExistsRequest = {
  aggregateId: AggregateId,
  tenantId?: string
}

export type DeleteAggregateOptions = {
  aggregateId?: AggregateId
  tenantId?: string
}

export type ConfirmDeleteAggregateOptions = {
  token: string
  aggregateId?: AggregateId
  tenantId?: string
}

export type AggregateMetadata = {
  version: number;
}

export type EventBatch<E> = {
  aggregateId: string;
  events: E[];
  expectedVersion?: number;
}

class AggregatesClient<A, S, T extends string, E extends { eventType: string }> extends BaseClient {
  private stateLoader: StateLoader<S, E>;

  constructor(serializedConfig,
              private aggregateClientConfig: AggregatesClientConfig<T>,
              private stateBuilder: StateBuilder<S, E>,
              private aggregateFactory: (state: S) => A) {
    super(serializedConfig);
    this.stateLoader = new StateLoader<S, E>()
  }

  get aggregateType(): T {
    return this.aggregateClientConfig.aggregateType
  }

  public async save(request: AggregateRequest<E>): Promise<number> {
    const {events, aggregateId, expectedVersion, tenantId} = request
    return await this.saveInternal({aggregateId, events, expectedVersion}, tenantId);
  }

  public async update(request: UpdateAggregateRequest, commandHandler: (aggregate: A) => E[]): Promise<number> {
    const tenantId = request?.tenantId
    try {
      return await this.retryStrategy.executeWithRetries(
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

  public async bulkSave(request: BulkSaveRequest<E>): Promise<number> {
    try {
      return await this.retryStrategy.executeWithRetries(() => this.saveBulkInternal(request.batches, request.tenantId))
    } catch (error) {
      if (isSerializedApiError(error)) {
        if (error.statusCode === 409) {
          throw new Conflict(this.aggregateType)
        }
      }
      throw error
    }
  }

  public async bulkUpdate(request: BulkUpdateRequest, commandHandler: (s) => E[]): Promise<number> {
    try {
      return await this.retryStrategy.executeWithRetries(
          async () => {
            let batches: EventBatch<E>[] = []
            for (const aggregateId of request.aggregateIds) {
              const response = await this.loadInternal({aggregateId});
              const currentVersion = response.metadata.version;
              const eventsToSave = commandHandler(response.aggregate);
              batches.push({aggregateId, events: eventsToSave, expectedVersion: currentVersion})
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

  public async create(request: CreateAggregateRequest, commandHandler: (a: A) => E[]): Promise<number> {

    const state = this.stateBuilder.initialState();
    const aggregate = this.aggregateFactory(state)
    const eventsToSave = commandHandler(aggregate);
    const tenantId = request?.tenantId
    const aggregateId = request.aggregateId;
    try {
      return await this.retryStrategy.executeWithRetries(
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
    const url = this.aggregateUrlPath(request.aggregateId);
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
        `${this.aggregateUrlPath(options.aggregateId)}` :
        `${this.aggregateTypeUrlPath}`
    const response = await this.axiosClient.delete(url, config);
    return response.data;
  }

  private async loadInternal(request: LoadAggregateRequest): Promise<{ aggregate: A, metadata: AggregateMetadata }> {
    const url = `${this.aggregateUrlPath(request.aggregateId)}`;
    const config = request.tenantId ? this.axiosConfig(request.tenantId!) : this.axiosConfig();

    const limit = request.limit ? request.limit : 1000;
    let since = request.since ? request.since : 0;

    const queryParams = new URLSearchParams();
    queryParams.set('since', String(since))
    queryParams.set('limit', String(limit))

    let response: LoadAggregateResponse<E> = null
    let currentState = this.stateBuilder.initialState();
    do {
      config.params = queryParams;
      const axiosResponse = await this.axiosClient.get(url, config);
      response = axiosResponse.data;
      currentState = this.stateLoader.loadState(currentState, this.stateBuilder, response.events)
      since += limit
      queryParams.set('since', String(since))
    } while (response.hasMore)

    const metadata = {version: response.aggregateVersion};
    const aggregate = this.aggregateFactory(currentState);
    console.log(`Loaded aggregate ${this.aggregateType}@${request.aggregateId}:${metadata.version}`)
    return {aggregate, metadata};
  }

  public async confirmDelete(options: ConfirmDeleteAggregateOptions): Promise<void> {
    const config = options && options.tenantId ? this.axiosConfig(options.tenantId!) : this.axiosConfig();
    const url = options.aggregateId ?
        `${this.aggregateUrlPath(options.aggregateId)}` :
        `${this.aggregateTypeUrlPath}`
    const queryParams = new URLSearchParams();
    if (options.token) {
      queryParams.set('deleteToken', options.token)
    }
    config.params = queryParams;
    await this.axiosClient.delete(url, config);
  }

  private async saveBulkInternal(batches: EventBatch<E>[], tenantId?: string): Promise<number> {
    const config = tenantId ? this.axiosConfig(tenantId!) : this.axiosConfig();
    if (batches.length === 0) {
      return 0
    }
    const url = `${this.aggregateTypeBulkEventsUrlPath}`;
    const data = {batches} as SaveBulkPayload<E>
    await this.axiosClient.post(url, data, config);
    const eventCounts = batches.map(b => b.events.length);
    return eventCounts.reduce((sum, current) => (sum + current), 0)
  }

  private async saveInternal(eventBatch: EventBatch<E>, tenantId?: string): Promise<number> {
    const config = tenantId ? this.axiosConfig(tenantId!) : this.axiosConfig();
    const {events, aggregateId, expectedVersion} = eventBatch
    if (events.length === 0) {
      return 0
    }
    let url = this.aggregateEventsUrlPath(aggregateId);
    await this.axiosClient.post(url, {
      events,
      expectedVersion
    }, config);
    return events.length
  }

  get retryStrategy() {
    return this.aggregateClientConfig.retryStrategy ?? new NoRetryStrategy()
  }

  get aggregateEventsUrlPath() {
    return (aggregateId: string) => {
      return `${this.aggregateUrlPath(aggregateId)}/events`;
    }
  }

  get aggregateUrlPath() {
    return (aggregateId: string) => {
      return `${this.aggregateTypeUrlPath}/${aggregateId}`;
    }
  }

  get aggregateTypeBulkEventsUrlPath() {
    return `${this.aggregateTypeUrlPath}/events`;
  }

  get aggregateTypeUrlPath() {
    return `/aggregates/${this.aggregateType}`;
  }
}

export {AggregatesClient}
