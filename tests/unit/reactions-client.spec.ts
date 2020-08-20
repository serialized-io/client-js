import {LoadReactionDefinitionResponse, Serialized, SerializedInstance} from "../../lib";

const {randomKeyConfig, mockClient, mockGetOk} = require("./client-helpers");

describe('Reactions client', () => {

  it('Can get reaction definition', async () => {
    const serializedInstance: SerializedInstance = Serialized.create(randomKeyConfig())
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
