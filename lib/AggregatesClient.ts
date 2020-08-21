import {BaseClient} from './BaseClient'

export interface AggregatePaginationOptions {
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
  events: DomainEvent[];
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
  aggregateType: AggregateType;
  aggregateId: AggregateId;
  payload: StoreEventsPayload
}

export interface LoadAggregateRequest extends AggregateRequest {
  options?: AggregatePaginationOptions;
}

export interface CheckAggregateExistsRequest extends AggregateRequest {
}

export interface DeleteAggregateRequest extends AggregateRequest {
  deleteToken?: boolean;
}

export interface DeleteAggregateTypeRequest extends AggregateRequest {
  deleteToken?: boolean;
}

export class AggregatesClient extends BaseClient {

  constructor(axiosClient, config) {
    super(axiosClient, config);
  }

  public async checkExists(request: CheckAggregateExistsRequest) {
    return (await this.axiosClient.head(this.aggregateUrlPath(request), this.axiosConfig())).data;
  }

  public async loadAggregate(request: LoadAggregateRequest): Promise<LoadAggregateResponse> {
    const config = this.axiosConfig();
    config.params = request.options;
    return (await this.axiosClient.get(this.aggregateUrlPath(request), config)).data;
  }

  public async storeEvents(request: StoreEventsRequest): Promise<void> {
    (await this.axiosClient.post(`${this.aggregateUrlPath(request)}/events`, request.payload, this.axiosConfig())).data;
  }

  public async deleteAggregate(request: DeleteAggregateRequest): Promise<DeleteAggregateResponse | void> {
    if (request.deleteToken) {
      let config = this.axiosConfig();
      config.params = {
        deleteToken: request.deleteToken
      };
      await this.axiosClient.get(this.aggregateUrlPath(request), config);
    } else {
      return (await this.axiosClient.delete(this.aggregateUrlPath(request), this.axiosConfig())).data;
    }
  }

  public async deleteAggregateType(request: DeleteAggregateTypeRequest): Promise<DeleteAggregateResponse | void> {
    if (request.deleteToken) {
      let config = this.axiosConfig();
      config.params = {
        deleteToken: request.deleteToken
      };
      await this.axiosClient.get(this.aggregateTypeUrlPath(request.aggregateType), config);
    } else {
      return (await this.axiosClient.delete(this.aggregateTypeUrlPath(request.aggregateType), this.axiosConfig())).data;
    }
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
    let data = (await this.axiosClient.post(`${this.aggregateUrlPath(aggregateRoot)}/events`, payload, this.axiosConfig())).data;
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
    return (await this.axiosClient.post(`${this.aggregateUrlPath(aggregateRoot)}/events`, payload, this.axiosConfig())).data;
  }

  public async load(aggregateRoot) {
    const response = (await this.axiosClient.get(this.aggregateUrlPath(aggregateRoot), this.axiosConfig())).data;
    aggregateRoot.fromEvents(response);
  }

  private aggregateUrlPath(request: AggregateRequest) {
    return `/aggregates/${request.aggregateType}/${request.aggregateId}`;
  }

  private aggregateTypeUrlPath(aggregateType: string) {
    return `/aggregates/${aggregateType}`;
  }

}
