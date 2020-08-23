import {BaseClient} from './BaseClient'

export interface LoadAggregateOptions {
  since?: number;
  limit?: number;
}

export interface DomainEvent {
  eventType: string;
  eventId?: string;
  data?: any;
  encryptedData?: string;
}

export interface DeleteAggregateResponse {
  deleteToken?: string;
}

export interface StoreEventsPayload {
  events: DomainEvent[],
  expectedVersion?: number;
}

type AggregateType = string;
type AggregateId = string;

export interface AggregateRequest {
  aggregateType: AggregateType,
  aggregateId: AggregateId,
}

export interface LoadAggregateResponse extends AggregateRequest {
  aggregateVersion: number;
  events: DomainEvent[];
  hasMore: false;
}

export interface StoreEventsRequest extends AggregateRequest {
  events: DomainEvent[];
}

export interface StoreEventsOptions {
  expectedVersion?: number;
}

export interface StoreEventRequest extends AggregateRequest {
  event: DomainEvent;
}

export interface LoadAggregateRequest extends AggregateRequest {
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

export class AggregatesClient extends BaseClient {

  constructor(axiosClient, config) {
    super(axiosClient, config);
  }

  public async checkExists(request: CheckAggregateExistsRequest) {
    const url = AggregatesClient.aggregateUrlPath(request.aggregateType, request.aggregateId);
    return (await this.axiosClient.head(url, this.axiosConfig())).data;
  }

  public async loadAggregate(request: LoadAggregateRequest, options?: LoadAggregateOptions): Promise<LoadAggregateResponse> {
    const url = AggregatesClient.aggregateUrlPath(request.aggregateType, request.aggregateId);
    const config = this.axiosConfig();
    config.params = options;
    return (await this.axiosClient.get(url, config)).data;
  }

  public async storeEvents(request: StoreEventsRequest, options?: StoreEventsOptions): Promise<void> {
    const url = `${AggregatesClient.aggregateEventsUrlPath(request.aggregateType, request.aggregateId)}`
    const payload: StoreEventsPayload = {
      events: request.events,
      expectedVersion: options?.expectedVersion
    };
    (await this.axiosClient.post(url, payload, this.axiosConfig())).data;
  }

  public async storeEvent(request: StoreEventRequest, options?: StoreEventsOptions): Promise<void> {
    const url = `${AggregatesClient.aggregateEventsUrlPath(request.aggregateType, request.aggregateId)}`
    const payload: StoreEventsPayload = {
      events: [request.event],
      expectedVersion: options?.expectedVersion
    };
    (await this.axiosClient.post(url, payload, this.axiosConfig())).data;
  }

  public async deleteAggregate(request: DeleteAggregateRequest, options?: DeleteAggregateOptions): Promise<DeleteAggregateResponse | void> {
    const url = `${AggregatesClient.aggregateUrlPath(request.aggregateType, request.aggregateId)}`
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

  public async save(aggregateRoot, consistencyCheck = true) {
    const uncommittedEvents = aggregateRoot.getUncommittedEvents();
    let payload;
    if (consistencyCheck) {
      payload = {
        events: uncommittedEvents,
        expectedVersion: aggregateRoot.getCurrentVersion(),
      }
    } else {
      payload = {
        events: uncommittedEvents,
      };
    }
    const url = `${AggregatesClient.aggregateUrlPath(aggregateRoot.aggregateType, aggregateRoot.aggregateId)}/events`;
    const data = (await this.axiosClient.post(url, payload, this.axiosConfig())).data;
    aggregateRoot.commit();

    if (consistencyCheck) {
      aggregateRoot.nextVersion();
    }

    return data;
  }

  public async create(aggregateRoot) {
    const uncommittedEvents = aggregateRoot.getUncommittedEvents();
    let payload = {
      events: uncommittedEvents,
      expectedVersion: 0,
    }
    const url = `${AggregatesClient.aggregateUrlPath(aggregateRoot.aggregateType, aggregateRoot.aggregateId)}/events`;
    return (await this.axiosClient.post(url, payload, this.axiosConfig())).data;
  }

  public async load(aggregateRoot) {
    const url = `${AggregatesClient.aggregateUrlPath(aggregateRoot.aggregateType, aggregateRoot.aggregateId)}`;
    const response = (await this.axiosClient.get(url, this.axiosConfig())).data;
    aggregateRoot.fromEvents(response);
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
