import {
  FeedsClient,
  LoadFeedOptions,
  LoadFeedResponse,
  LoadFeedsOverviewResponse,
  Serialized,
  SerializedInstance
} from "../../lib";

const uuidv4 = require("uuid").v4;
const {randomKeyConfig, mockClient, mockGetOk} = require("./client-helpers");

describe('Feed client', () => {

  it('Can list feeds', async () => {
    const serializedInstance: SerializedInstance = Serialized.create(randomKeyConfig())

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
        serializedInstance.axiosClient,
        [mockGetOk(RegExp(`^${FeedsClient.feedsUrl()}$`), expectedResponse)]);

    const response = await serializedInstance.feeds.loadOverview();
    expect(response).toStrictEqual(expectedResponse)
  })

  it('Can load feed with pagination', async () => {

    const serializedInstance: SerializedInstance = Serialized.create(randomKeyConfig())
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
        serializedInstance.axiosClient,
        [mockGetOk(RegExp(`^${FeedsClient.feedUrl('user-registration')}$`), expectedResponse)]);

    const response = await serializedInstance.feeds.loadFeed({
      feedName: 'user-registration',
      options: requestOptions
    });
    expect(response).toStrictEqual(expectedResponse)
  });

})
