import {BaseClient} from './BaseClient'
import {PaginationOptions} from "./types";

export interface DomainEvent {
  eventType: string;
  eventId?: string;
  data?: any;
  encryptedData?: string;
}

export interface DeleteAggregateResponse {
  deleteToken?: string;
}

export interface LoadAggregateResponse {
  aggregateId: string;
  aggregateVersion: number;
  aggregateType: string;
  events: DomainEvent[];
  hasMore: false;
}

export interface StoreEventsPayload {
  events: DomainEvent[];
  expectedVersion?: number;
}

export interface StoreEventsRequest {
  aggregateType: AggregateType;
  aggregateId: AggregateId;
  payload: StoreEventsPayload
}

export interface LoadAggregateRequest {
  aggregateType: AggregateType,
  aggregateId: AggregateId,
  paginationParams: PaginationOptions
}

export interface CheckAggregateExistsRequest {
  aggregateType: AggregateType;
  aggregateId: AggregateId;
}

export interface DeleteAggregateRequest {
  aggregateType: AggregateType;
  aggregateId: AggregateId;
  deleteToken?: boolean;
}

export interface DeleteAggregateTypeRequest {
  aggregateType: AggregateType;
  aggregateId: AggregateId;
  deleteToken?: boolean;
}

type AggregateType = string;
type AggregateId = string;

export class AggregatesClient extends BaseClient {

  constructor(axiosClient, config) {
    super(axiosClient, config);
  }

  public async checkExists(request: CheckAggregateExistsRequest) {
    return (await this.axiosClient.head(`/aggregates/${request.aggregateType}/${request.aggregateId}`, this.axiosConfig())).data;
  }

  public async loadAggregate(request: LoadAggregateRequest): Promise<LoadAggregateResponse> {
    const config = this.axiosConfig();
    config.params = request.paginationParams;
    return (await this.axiosClient.get(`/aggregates/${request.aggregateType}/${request.aggregateId}`, config)).data;
  }

  public async storeEvents(request: StoreEventsRequest): Promise<void> {
    (await this.axiosClient.post(`/aggregates/${request.aggregateType}/${request.aggregateId}/events`, request.payload, this.axiosConfig())).data;
  }

  public async deleteAggregate(request: DeleteAggregateRequest): Promise<DeleteAggregateResponse | void> {
    if (request.deleteToken) {
      let config = this.axiosConfig();
      config.params = {
        deleteToken: request.deleteToken
      };
      await this.axiosClient.get(`/aggregates/${request.aggregateType}/${request.aggregateId}`, config);
    } else {
      return (await this.axiosClient.delete(`/aggregates/${request.aggregateType}/${request.aggregateId}`, this.axiosConfig())).data;
    }
  }

  public async deleteAggregateType(request: DeleteAggregateTypeRequest): Promise<DeleteAggregateResponse | void> {
    if (request.deleteToken) {
      let config = this.axiosConfig();
      config.params = {
        deleteToken: request.deleteToken
      };
      await this.axiosClient.get(`/aggregates/${request.aggregateType}`, config);
    } else {
      return (await this.axiosClient.delete(`/aggregates/${request.aggregateType}`, this.axiosConfig())).data;
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
    let data = (await this.axiosClient.post(`/aggregates/${aggregateRoot.aggregateType}/${aggregateRoot.aggregateId}/events`, payload, this.axiosConfig())).data;
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
    return (await this.axiosClient.post(`/aggregates/${aggregateRoot.aggregateType}/${aggregateRoot.aggregateId}/events`, payload, this.axiosConfig())).data;
  }

  public async load(aggregateRoot) {
    const response = (await this.axiosClient.get(`/aggregates/${aggregateRoot.aggregateType}/${aggregateRoot.aggregateId}`, this.axiosConfig())).data;
    aggregateRoot.fromEvents(response);
  }

}
