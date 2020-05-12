import {BaseClient} from "./BaseClient";
import {AxiosInstance} from "axios";
import {PaginationOptions, SerializedConfig} from "./types";

export interface FeedEvent {
  eventType: string;
  eventId: string;
  data?: any;
  encryptedData?: number;
}

export interface FeedEntry {
  sequenceNumber: number;
  aggregateId: string;
  timestamp: number;
  feedName: string;
  events: FeedEvent[];
}

export interface FeedOverview {
  aggregateType: string;
  aggregateCount: number;
  batchCount: number;
  eventCount: number;
}

export interface LoadFeedResponse {
  entries: FeedEntry[],
  hasMore: boolean;
  currentSequenceNumber: number;
}

export interface LoadFeedsOverviewResponse {
  feeds: FeedOverview[];
}

export class FeedsClient extends BaseClient {

  constructor(axiosClient: AxiosInstance, config: SerializedConfig) {
    super(axiosClient, config);
  }

  public async loadOverview(): Promise<LoadFeedsOverviewResponse> {
    return (await this.axiosClient.get(`/feeds`)).data;
  }

  public async loadFeed(feedName: string, paginationOptions?: PaginationOptions): Promise<LoadFeedResponse> {
    const config = this.axiosConfig();
    config.params = paginationOptions;
    return (await this.axiosClient.get(`/feeds/${feedName}`, config)).data;
  }

  public async loadAllFeed(feedName: string, paginationOptions?: PaginationOptions): Promise<LoadFeedResponse> {
    const config = this.axiosConfig();
    config.params = paginationOptions;
    return (await this.axiosClient.get(`/feeds/_all`, config)).data;
  }

  public async getCurrentSequenceNumber(feedName: string): Promise<number> {
    const headers = (await this.axiosClient.head(`/feeds/${feedName}`)).headers;
    return headers['Serialized-SequenceNumber-Current']
  }

  public async getGlobalSequenceNumber(): Promise<number> {
    const headers = (await this.axiosClient.head(`/feeds/_all`)).headers;
    return headers['Serialized-SequenceNumber-Current']
  }
}
