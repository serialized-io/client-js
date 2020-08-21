import {Serialized, SerializedInstance} from "../../lib";
import {AggregatesClient, StoreEventRequest} from "../../lib/AggregatesClient";

const uuidv4 = require("uuid").v4;
const {randomKeyConfig, mockClient, mockPostOk} = require("./client-helpers");

describe('Aggregate client', () => {

  it('Can store a single event', async () => {
    const serializedInstance: SerializedInstance = Serialized.create(randomKeyConfig())
    const aggregateId = uuidv4();
    const aggregateType = 'user-registration';
    const request: StoreEventRequest = {
      aggregateType: aggregateType,
      aggregateId: aggregateId,
      event: {
        eventType: 'UserRegistrationStarted',
        data: {
          email: 'johndoe@example.com'
        }
      }
    }

    mockClient(
        serializedInstance.axiosClient,
        [mockPostOk(RegExp(`^${(AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId))}$`))]);

    await serializedInstance.aggregates.storeEvent(request);
  })

})
