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
        [mockGetOk(RegExp(`^${FeedsClient.feedUrl('user-registration')}$`), expectedResponse)]);

    const response = await feedsClient.loadFeed({feedName: 'user-registration'}, requestOptions);
    expect(response).toStrictEqual(expectedResponse)
  });

})
