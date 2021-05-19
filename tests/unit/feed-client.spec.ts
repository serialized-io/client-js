import {FeedsClient, LoadFeedOptions, LoadFeedResponse, LoadFeedsOverviewResponse, Serialized} from "../../lib";
import {v4 as uuidv4} from "uuid";
import MockAdapter from "axios-mock-adapter";

const {
  randomKeyConfig,
  mockClient,
  assertMatchesSingleTenantRequestHeaders,
  assertMatchesMultiTenantRequestHeaders
} = require("./client-helpers");

describe('Feed client', () => {

  it('Can list feeds', async () => {
    const config = randomKeyConfig();
    const feedsClient = Serialized.create(config).feedsClient()
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
        [
          (mock: MockAdapter) => {
            mock.onGet(RegExp(`^${FeedsClient.feedsUrl()}$`))
                .reply(async (request) => {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  assertMatchesSingleTenantRequestHeaders(request, config);
                  return [200, expectedResponse];
                });
          }
        ])

    const response = await feedsClient.loadOverview();
    expect(response).toStrictEqual(expectedResponse)
  })

  it('Can load feed without options', async () => {

    const config = randomKeyConfig();
    const feedsClient = Serialized.create(config).feedsClient()
    const aggregateId = uuidv4();
    const feedName = 'users';
    const expectedResponse: LoadFeedResponse = {
      currentSequenceNumber: 10,
      entries: [{
        aggregateId: aggregateId,
        events: [],
        feedName,
        sequenceNumber: 1,
        timestamp: 0
      }],
      hasMore: false
    }

    mockClient(
        feedsClient.axiosClient,
        [
          (mock: MockAdapter) => {
            mock.onGet(RegExp(`^${FeedsClient.feedUrl(feedName)}$`))
                .reply(async (request) => {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  assertMatchesSingleTenantRequestHeaders(request, config);
                  return [200, expectedResponse];
                });
          }
        ])

    const response = await feedsClient.loadFeed({feedName});
    expect(response).toStrictEqual(expectedResponse)
  });

  it('Can load feed with pagination', async () => {

    const config = randomKeyConfig();
    const feedsClient = Serialized.create(config).feedsClient()
    const aggregateId = uuidv4();
    const feedName = 'user-registration';

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
          (mock: MockAdapter) => {
            mock.onGet(RegExp(`^${FeedsClient.feedUrl(feedName)}$`))
                .reply(async (request) => {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  assertMatchesSingleTenantRequestHeaders(request, config);
                  const params: URLSearchParams = request.params;
                  expect(params.get('since')).toStrictEqual("0")
                  expect(params.get('limit')).toStrictEqual("10")
                  return [200, expectedResponse];
                });
          }
        ])
    const response = await feedsClient.loadFeed({feedName}, requestOptions);
    expect(response).toStrictEqual(expectedResponse)
  });

  it('Can load feed with waitTime', async () => {

    const config = randomKeyConfig();
    const feedsClient = Serialized.create(config).feedsClient()
    const aggregateId = uuidv4();
    const feedName = 'user-registration';
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
          (mock: MockAdapter) => {
            mock.onGet(RegExp(`^${FeedsClient.feedUrl(feedName)}$`))
                .reply(async (request) => {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  assertMatchesSingleTenantRequestHeaders(request, config);
                  expect(request.params.get('waitTime')).toStrictEqual("1000")
                  return [200, expectedResponse];
                });
          }
        ]);

    const response = await feedsClient.loadFeed({feedName}, requestOptions);
    expect(response).toStrictEqual(expectedResponse)
  });

  it('Can filter on types', async () => {

    const config = randomKeyConfig();
    const feedsClient = Serialized.create(config).feedsClient()
    const aggregateId = uuidv4();
    const feedName = 'user-registration';
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
          (mock: MockAdapter) => {
            mock.onGet(RegExp(`^${FeedsClient.feedUrl(feedName)}$`))
                .reply(async (request) => {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  assertMatchesSingleTenantRequestHeaders(request, config);
                  const params: URLSearchParams = request.params;
                  expect(params.getAll('filterType')).toEqual(requestOptions.types);
                  return [200, expectedResponse];
                });
          }
        ]);

    const response = await feedsClient.loadFeed({feedName}, requestOptions);
    expect(response).toStrictEqual(expectedResponse)
  })

  it('Can use partitioned feeding', async () => {

    const config = randomKeyConfig();
    const feedsClient = Serialized.create(config).feedsClient()
    const aggregateId = uuidv4();
    const feedName = 'user-registration';
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
          (mock: MockAdapter) => {
            mock.onGet(RegExp(`^${FeedsClient.feedUrl(feedName)}$`))
                .reply(async (request) => {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  assertMatchesSingleTenantRequestHeaders(request, config);
                  let params: URLSearchParams = request.params;
                  expect(params.get('partitionNumber')).toStrictEqual("1");
                  expect(params.get('partitionCount')).toStrictEqual("2");
                  return [200, expectedResponse];
                });
          }
        ]);

    const response = await feedsClient.loadFeed({feedName}, requestOptions);
    expect(response).toStrictEqual(expectedResponse)
  });

  it('Can load multi-tenant feed', async () => {

    const config = randomKeyConfig();
    const feedsClient = Serialized.create(config).feedsClient()
    const aggregateId = uuidv4();
    const feedName = 'users';
    const tenantId = uuidv4();
    const expectedResponse: LoadFeedResponse = {
      currentSequenceNumber: 10,
      entries: [{
        aggregateId: aggregateId,
        events: [],
        feedName,
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
          (mock: MockAdapter) => {
            mock.onGet(RegExp(`^${FeedsClient.feedUrl(feedName)}$`))
                .reply(async (request) => {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  assertMatchesMultiTenantRequestHeaders(request, config, tenantId);
                  return [200, expectedResponse];
                });
          }
        ]);

    const response = await feedsClient.loadFeed({feedName}, requestOptions);
    expect(response).toStrictEqual(expectedResponse)
  });

})
