import {FeedsClient, LoadFeedResponse, LoadFeedsOverviewResponse, Serialized} from "../../lib";
import {v4 as uuidv4} from "uuid";
import {DataMatcherMap} from "nock";
import nock = require("nock");

const {randomKeyConfig, mockSerializedApiCalls} = require("./client-helpers");

describe('Feed client', () => {

  afterEach(function () {
    nock.cleanAll()
  })

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

    mockSerializedApiCalls(config)
        .get(FeedsClient.feedsUrl())
        .reply(200, expectedResponse)

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

    mockSerializedApiCalls(config)
        .get(FeedsClient.feedUrl(feedName))
        .reply(200, expectedResponse)

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

    mockSerializedApiCalls(config)
        .get(FeedsClient.feedUrl(feedName))
        .query({'limit': 10, 'since': 0})
        .reply(200, expectedResponse)

    const response = await feedsClient.loadFeed({
      feedName,
      since: 0,
      limit: 10
    });
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

    mockSerializedApiCalls(config)
        .get(FeedsClient.feedUrl(feedName))
        .query({'waitTime': 1000})
        .reply(200, expectedResponse)

    const response = await feedsClient.loadFeed({
      feedName,
      waitTime: 1000
    });
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

    mockSerializedApiCalls(config)
        .get(FeedsClient.feedUrl(feedName))
        .query({'filterType': ['UserRegistered', 'UserUnregistered']} as DataMatcherMap)
        .reply(200, expectedResponse)

    const response = await feedsClient.loadFeed({feedName, types: ['UserRegistered', 'UserUnregistered']});
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

    mockSerializedApiCalls(config)
        .get(FeedsClient.feedUrl(feedName))
        .query({'partitionNumber': 1, 'partitionCount': 2})
        .reply(200, expectedResponse)

    const response = await feedsClient.loadFeed({
      feedName, partitionNumber: 1,
      partitionCount: 2
    });
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

    mockSerializedApiCalls(config, tenantId)
        .get(FeedsClient.feedUrl(feedName))
        .reply(200, expectedResponse)

    const response = await feedsClient.loadFeed({feedName, tenantId});
    expect(response).toStrictEqual(expectedResponse)
  });

})
