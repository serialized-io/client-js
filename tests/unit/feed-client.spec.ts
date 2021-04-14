import {FeedsClient, LoadFeedOptions, LoadFeedResponse, LoadFeedsOverviewResponse, Serialized} from "../../lib";
import {v4 as uuidv4} from "uuid";

const {randomKeyConfig, mockClient, mockGetOk} = require("./client-helpers");

describe('Feed client', () => {

  it('Can list feeds', async () => {
    const feedsClient = Serialized.create(randomKeyConfig()).feedsClient()
    const expectedResponse: LoadFeedsOverviewResponse = {
      feeds: [{
        aggregateCount: 1,
        aggregateType: 'user-registration',
        batchCount: 1,
        eventCount: 1
      }
      ]
    }

    mockClient(
        feedsClient.axiosClient,
        [mockGetOk(RegExp(`^${FeedsClient.feedsUrl()}$`), expectedResponse)]);

    const response = await feedsClient.loadOverview();
    expect(response).toStrictEqual(expectedResponse)
  })

  it('Can load feed without options', async () => {

    const feedsClient = Serialized.create(randomKeyConfig()).feedsClient()
    const aggregateId = uuidv4();
    const expectedResponse: LoadFeedResponse = {
      currentSequenceNumber: 10,
      entries: [{
        aggregateId: aggregateId,
        events: [],
        feedName: '',
        sequenceNumber: 1,
        timestamp: 0
      }],
      hasMore: false
    }

    mockClient(
        feedsClient.axiosClient,
        [mockGetOk(RegExp(`^${FeedsClient.feedUrl('user-registration')}$`), expectedResponse)]);

    const response = await feedsClient.loadFeed({feedName: 'user-registration'});
    expect(response).toStrictEqual(expectedResponse)
  });

  it('Can load feed with pagination', async () => {

    const feedsClient = Serialized.create(randomKeyConfig()).feedsClient()
    const aggregateId = uuidv4();
    const expectedResponse: LoadFeedResponse = {
      currentSequenceNumber: 10,
      entries: [{
        aggregateId: aggregateId,
        events: [],
        feedName: '',
        sequenceNumber: 1,
        timestamp: 0
      }],
      hasMore: false
    }
    const requestOptions: LoadFeedOptions = {
      since: 0,
      limit: 10
    }
    mockClient(
        feedsClient.axiosClient,
        [
          (mock) => {
            const expectedUrl = FeedsClient.feedUrl('user-registration');
            const matcher = RegExp(`^${expectedUrl}$`);
            mock.onGet(matcher).reply(async (config) => {
              await new Promise((resolve) => setTimeout(resolve, 300));
              const params: URLSearchParams = config.params;
              expect(params.get('since')).toStrictEqual("0")
              expect(params.get('limit')).toStrictEqual("10")
              return [200, expectedResponse];
            });
          }
        ])
    const response = await feedsClient.loadFeed({feedName: 'user-registration'}, requestOptions);
    expect(response).toStrictEqual(expectedResponse)
  });

  it('Can load feed with waitTime', async () => {

    const feedsClient = Serialized.create(randomKeyConfig()).feedsClient()
    const aggregateId = uuidv4();
    const expectedResponse: LoadFeedResponse = {
      currentSequenceNumber: 10,
      entries: [{
        aggregateId: aggregateId,
        events: [],
        feedName: '',
        sequenceNumber: 1,
        timestamp: 0
      }],
      hasMore: false
    }
    const requestOptions: LoadFeedOptions = {
      waitTime: 1000
    }

    mockClient(
        feedsClient.axiosClient,
        [
          (mock) => {
            const expectedUrl = FeedsClient.feedUrl('user-registration');
            const matcher = RegExp(`^${expectedUrl}$`);
            mock.onGet(matcher).reply(async (config) => {
              await new Promise((resolve) => setTimeout(resolve, 300));
              expect(config.params.get('waitTime')).toStrictEqual("1000")
              return [200, expectedResponse];
            });
          }
        ]);

    const response = await feedsClient.loadFeed({feedName: 'user-registration'}, requestOptions);
    expect(response).toStrictEqual(expectedResponse)
  });

  it('Can filter on types', async () => {

    const feedsClient = Serialized.create(randomKeyConfig()).feedsClient()
    const aggregateId = uuidv4();
    const expectedResponse: LoadFeedResponse = {
      currentSequenceNumber: 10,
      entries: [{
        aggregateId: aggregateId,
        events: [],
        feedName: 'users',
        sequenceNumber: 1,
        timestamp: 0
      }],
      hasMore: false
    }
    const requestOptions: LoadFeedOptions = {
      types: ['UserRegistered', 'UserUnregistered']
    }

    mockClient(
        feedsClient.axiosClient,
        [
          (mock) => {
            const expectedUrl = FeedsClient.feedUrl('user-registration');
            const matcher = RegExp(`^${expectedUrl}$`);
            mock.onGet(matcher).reply(async (config) => {
              await new Promise((resolve) => setTimeout(resolve, 300));
              let params : URLSearchParams = config.params;
              expect(params.getAll('filterType')).toEqual(requestOptions.types);
              return [200, expectedResponse];
            });
          }
        ]);

    const response = await feedsClient.loadFeed({feedName: 'user-registration'}, requestOptions);
    expect(response).toStrictEqual(expectedResponse)
  })

  it('Can use partitioned feeding', async () => {

    const feedsClient = Serialized.create(randomKeyConfig()).feedsClient()
    const aggregateId = uuidv4();
    const expectedResponse: LoadFeedResponse = {
      currentSequenceNumber: 10,
      entries: [{
        aggregateId: aggregateId,
        events: [],
        feedName: 'users',
        sequenceNumber: 1,
        timestamp: 0
      }],
      hasMore: false
    }
    const requestOptions: LoadFeedOptions = {
      partitionNumber: 1,
      partitionCount: 2
    }

    mockClient(
        feedsClient.axiosClient,
        [
          (mock) => {
            const expectedUrl = FeedsClient.feedUrl('user-registration');
            const matcher = RegExp(`^${expectedUrl}$`);
            mock.onGet(matcher).reply(async (config) => {
              await new Promise((resolve) => setTimeout(resolve, 300));
              let params: URLSearchParams = config.params;
              expect(params.get('partitionNumber')).toStrictEqual("1");
              expect(params.get('partitionCount')).toStrictEqual("2");
              return [200, expectedResponse];
            });
          }
        ]);

    const response = await feedsClient.loadFeed({feedName: 'user-registration'}, requestOptions);
    expect(response).toStrictEqual(expectedResponse)
  });

  it('Can load multi-tenant feed', async () => {

    const feedsClient = Serialized.create(randomKeyConfig()).feedsClient()
    const aggregateId = uuidv4();
    const tenantId = uuidv4();
    const expectedResponse: LoadFeedResponse = {
      currentSequenceNumber: 10,
      entries: [{
        aggregateId: aggregateId,
        events: [],
        feedName: 'users',
        sequenceNumber: 1,
        timestamp: 0
      }],
      hasMore: false
    }
    const requestOptions: LoadFeedOptions = {
      tenantId
    }

    mockClient(
        feedsClient.axiosClient,
        [
          (mock) => {
            const expectedUrl = FeedsClient.feedUrl('user-registration');
            const matcher = RegExp(`^${expectedUrl}$`);
            mock.onGet(matcher).reply(async (config) => {
              await new Promise((resolve) => setTimeout(resolve, 300));
              expect(config.headers['Serialized-Tenant-Id']).toStrictEqual(tenantId);
              return [200, expectedResponse];
            });
          }
        ]);

    const response = await feedsClient.loadFeed({feedName: 'user-registration'}, requestOptions);
    expect(response).toStrictEqual(expectedResponse)
  });

})
