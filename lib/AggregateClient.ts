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

type AggregateType = string;
type AggregateId = string;

export class AggregatesClient extends BaseClient {

  constructor(axiosClient, config) {
    super(axiosClient, config);
  }

  public async checkExists(aggregateType: AggregateType, aggregateId: AggregateId) {
    return (await this.axiosClient.head(`/aggregates/${aggregateType}/${aggregateId}`, this.axiosConfig())).data;
  }

  public async loadAggregate(aggregateType: AggregateType, aggregateId: AggregateId, paginationParams: PaginationOptions): Promise<LoadAggregateResponse> {
    const config = this.axiosConfig();
    config.params = paginationParams;
    return (await this.axiosClient.get(`/aggregates/${aggregateType}/${aggregateId}`, config)).data;
  }

  public async storeEvents(aggregateType: AggregateType, aggregateId: AggregateId, payload: StoreEventsPayload): Promise<void> {
    (await this.axiosClient.post(`/aggregates/${aggregateType}/${aggregateId}/events`, payload, this.axiosConfig())).data;
  }

  public async deleteAggregate(aggregateType: AggregateType, aggregateId: AggregateId, deleteToken?: boolean): Promise<DeleteAggregateResponse | void> {
    if (deleteToken) {
      let config = this.axiosConfig();
      config.params = {
        deleteToken: deleteToken
      };
      await this.axiosClient.get(`/aggregates/${aggregateType}/${aggregateId}`, config);
    } else {
      return (await this.axiosClient.delete(`/aggregates/${aggregateType}/${aggregateId}`, this.axiosConfig())).data;
    }
  }

  public async deleteAggregateType(aggregateType: AggregateType, aggregateId: AggregateId, deleteToken?: boolean): Promise<DeleteAggregateResponse | void> {
    if (deleteToken) {
      let config = this.axiosConfig();
      config.params = {
        deleteToken: deleteToken
      };
      await this.axiosClient.get(`/aggregates/${aggregateType}`, config);
    } else {
      return (await this.axiosClient.delete(`/aggregates/${aggregateType}`, this.axiosConfig())).data;
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
