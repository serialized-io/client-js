import {BaseClient} from "./";

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

export interface LoadFeedRequest {
  feedName: string
  tenantId?: string
  since?: number
  limit?: number
  from?: string
  to?: string
  waitTime?: number
  types?: string[]
  partitionNumber?: number
  partitionCount?: number
}

export interface LoadAllFeedRequest {
  tenantId?: string
  since?: number
  limit?: number
  from?: string
  to?: string
  waitTime?: number
  types?: string[]
  partitionNumber?: number
  partitionCount?: number
}

export interface GetCurrentSequenceNumberRequest {
  feedName: string
  tenantId?: string
}

export interface GetGlobalSequenceNumberRequest {
  tenantId?: string
}

export class FeedsClient extends BaseClient {

  public async loadOverview(): Promise<LoadFeedsOverviewResponse> {
    return (await this.axiosClient.get(FeedsClient.feedsUrl())).data;
  }

  public async loadFeed(request: LoadFeedRequest): Promise<LoadFeedResponse> {
    let config = this.axiosConfig();
    const params = new URLSearchParams();

    if (request.tenantId !== undefined) {
      config = this.axiosConfig(request.tenantId!);
    }
    if (request.limit !== undefined) {
      params.set('limit', String(request.limit))
    }
    if (request.since !== undefined) {
      params.set('since', String(request.since))
    }
    if (request.from !== undefined) {
      params.set('from', String(request.from))
    }
    if (request.to !== undefined) {
      params.set('to', String(request.to))
    }
    if (request.waitTime !== undefined) {
      params.set('waitTime', String(request.waitTime))
    }
    if (request.partitionNumber !== undefined) {
      params.set('partitionNumber', String(request.partitionNumber))
    }
    if (request.partitionCount !== undefined) {
      params.set('partitionCount', String(request.partitionCount))
    }
    if (request.types) {
      request.types.forEach((type) => {
        params.append('filterType', type)
      })
    }
    config.params = params;
    return (await this.axiosClient.get(FeedsClient.feedUrl(request.feedName), config)).data;
  }

  public async loadAllFeed(request: LoadAllFeedRequest): Promise<LoadFeedResponse> {
    return await this.loadFeed({feedName: '_all', ...{request}});
  }

  public async getCurrentSequenceNumber(request: GetCurrentSequenceNumberRequest): Promise<number> {
    const headers = (await this.axiosClient.head(FeedsClient.feedUrl(request.feedName))).headers;
    return Number(headers['Serialized-SequenceNumber-Current'])
  }

  public async getGlobalSequenceNumber(request: GetGlobalSequenceNumberRequest): Promise<number> {
    const headers = (await this.axiosClient.head(FeedsClient.allFeedUrl())).headers;
    return Number(headers['Serialized-SequenceNumber-Current'])
  }

  public static feedsUrl() {
    return `/feeds`;
  }

  public static allFeedUrl() {
    return `/feeds/_all`;
  }

  public static feedUrl(feedName: string) {
    return `/feeds/${feedName}`;
  }

}
