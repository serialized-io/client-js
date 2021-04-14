import {BaseClient} from "./";

export interface FeedEvent {
  eventType: string;
  eventId: string;
  data?: any;
  encryptedData?: number;
}

export interface LoadFeedOptions {
  tenantId?: string;
  since?: number;
  limit?: number;
  from?: string;
  to?: string;
  waitTime?: number;
  eagerFetching?: boolean;
  types?: string[];
  partitionNumber?: number;
  partitionCount?: number;
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

export interface FeedRequest {
  feedName: string;
}

export interface LoadFeedRequest extends FeedRequest {
}

export interface LoadAllFeedRequest {
  feedName: string;
  options?: LoadFeedOptions;
}

export interface SequenceNumberTracker {
  readonly lastConsumedSequenceNumber: number;

  updateLastConsumedSequenceNumber(currentSequenceNumber: number): void;
}

export interface FeedEntryHandler {

  handle(feedEntry: FeedEntry): void;
}

export class FeedsClient extends BaseClient {

  public async loadOverview(): Promise<LoadFeedsOverviewResponse> {
    return (await this.axiosClient.get(FeedsClient.feedsUrl())).data;
  }

  public async loadFeed(request: LoadFeedRequest, options?: LoadFeedOptions): Promise<LoadFeedResponse> {
    let config = this.axiosConfig();
    const params = new URLSearchParams();
    if (options) {
      if (options.tenantId !== undefined) {
        config = this.axiosConfig(options.tenantId!);
      }
      if (options.limit !== undefined) {
        params.set('limit', String(options.limit))
      }
      if (options.since !== undefined) {
        params.set('since', String(options.since))
      }
      if (options.from !== undefined) {
        params.set('from', String(options.from))
      }
      if (options.to !== undefined) {
        params.set('to', String(options.to))
      }
      if (options.waitTime !== undefined) {
        params.set('waitTime', String(options.waitTime))
      }
      if (options.eagerFetching !== undefined) {
        params.set('eagerFetching', String(options.eagerFetching))
      }
      if (options.partitionNumber !== undefined) {
        params.set('partitionNumber', String(options.partitionNumber))
      }
      if (options.partitionCount !== undefined) {
        params.set('partitionCount', String(options.partitionCount))
      }
      if (options.types) {
        options.types.forEach((type) => {
          params.append('filterType', type)
        })
      }
    }
    config.params = params;
    return (await this.axiosClient.get(FeedsClient.feedUrl(request.feedName), config)).data;
  }

  public async loadAllFeed(request: LoadAllFeedRequest): Promise<LoadFeedResponse> {
    const config = this.axiosConfig();
    config.params = request.options;
    return (await this.axiosClient.get(FeedsClient.allFeedUrl(), config)).data;
  }

  public async getCurrentSequenceNumber(request: FeedRequest): Promise<number> {
    const headers = (await this.axiosClient.head(FeedsClient.feedUrl(request.feedName))).headers;
    return headers['Serialized-SequenceNumber-Current']
  }

  public async getGlobalSequenceNumber(): Promise<number> {
    const headers = (await this.axiosClient.head(FeedsClient.allFeedUrl())).headers;
    return headers['Serialized-SequenceNumber-Current']
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
