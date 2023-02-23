import {BaseClient} from "./";

export type FeedEvent = {
  readonly eventType: string;
  readonly eventId: string;
  readonly data?: any;
  readonly encryptedData?: number;
}

export type FeedEntry = {
  readonly sequenceNumber: number;
  readonly aggregateId: string;
  readonly timestamp: number;
  readonly feedName: string;
  readonly events: FeedEvent[];
}

export type FeedOverview = {
  readonly aggregateType: string;
  readonly aggregateCount: number;
  readonly batchCount: number;
  readonly eventCount: number;
}

export type LoadFeedResponse = {
  readonly entries: FeedEntry[],
  readonly hasMore: boolean;
  readonly currentSequenceNumber: number;
}

export type LoadFeedsOverviewResponse = {
  readonly feeds: FeedOverview[];
}

export type LoadFeedRequest = {
  readonly feedName: string
  readonly tenantId?: string
  readonly since?: number
  readonly limit?: number
  readonly from?: string
  readonly to?: string
  readonly waitTime?: number
  readonly types?: string[]
  readonly partitionNumber?: number
  readonly partitionCount?: number
}

export type LoadAllFeedRequest = {
  readonly tenantId?: string
  readonly since?: number
  readonly limit?: number
  readonly from?: string
  readonly to?: string
  readonly waitTime?: number
  readonly types?: string[]
  readonly partitionNumber?: number
  readonly partitionCount?: number
}

export type GetCurrentSequenceNumberRequest = {
  readonly feedName: string
  readonly tenantId?: string
}

export type GetGlobalSequenceNumberRequest = {
  readonly tenantId?: string
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
