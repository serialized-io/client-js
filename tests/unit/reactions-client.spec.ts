import {HttpAction, LoadReactionDefinitionResponse, ReactionsClient, Serialized, SerializedInstance} from "../../lib";

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

  })


  it('Can create a reaction definition', async () => {
    const serializedInstance: SerializedInstance = Serialized.create(randomKeyConfig())
    const sendEmailAction: HttpAction = {
      actionType: 'HTTP_POST',
      targetUri: 'https://some-email-service'
    };
    const reactionDefinition = {
      reactionName: 'email-registered-user',
      feedName: 'user-registration',
      reactOnEventType: 'UserRegistrationCompleted',
      action: sendEmailAction
    }

    mockClient(
        serializedInstance.axiosClient,
        [
          (mock) => {
            const expectedUrl = ReactionsClient.reactionDefinitionUrl('email-registered-user');
            const matcher = RegExp(`^${expectedUrl}$`);
            mock.onPut(matcher).reply(async () => {
              await new Promise((resolve) => setTimeout(resolve, 300));
              return [200, reactionDefinition];
            });
          }
        ]);

    await serializedInstance.reactions.createOrUpdateReactionDefinition(reactionDefinition);
  });

})
