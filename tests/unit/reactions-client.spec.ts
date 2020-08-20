import {LoadReactionDefinitionResponse, Serialized, SerializedInstance} from "../../lib";
import {v4 as uuidv4} from 'uuid';

var {mockClient, mockGetOk} = require("./client-helpers");

describe('Reactions client', () => {

  it('Can get reaction definition', async () => {
    const serializedInstance: SerializedInstance = Serialized.create({accessKey: uuidv4(), secretAccessKey: uuidv4()})
    const expectedResponse: LoadReactionDefinitionResponse = {
      reactionName: 'my-definition',
      feedName: 'todos',
      reactOnEventType: '',
      action: {
        actionType: "HTTP_POST",
        targetUri: 'https://example.com/test-reaction'
      }
    }

    mockClient(
        serializedInstance.axiosClient,
        [
          mockGetOk(RegExp(`^\/reactions/definitions/my-definition$`), expectedResponse),
        ]);

    const reactionDefinition = await serializedInstance.reactions.getReactionDefinition({reactionName: 'my-definition'});
    expect(reactionDefinition.reactionName).toStrictEqual('my-definition')

  });

})
