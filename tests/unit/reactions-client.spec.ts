import {HttpAction, LoadReactionDefinitionResponse, ReactionsClient, Serialized} from "../../lib";

const {randomKeyConfig, mockClient, mockGetOk} = require("./client-helpers");

describe('Reactions client', () => {

  it('Can get reaction definition', async () => {
    const reactionsClient = Serialized.create(randomKeyConfig()).reactionsClient()
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
        reactionsClient.axiosClient,
        [
          mockGetOk(RegExp(`^\/reactions/definitions/my-definition$`), expectedResponse),
        ]);

    const reactionDefinition = await reactionsClient.getReactionDefinition({reactionName: 'my-definition'});
    expect(reactionDefinition.reactionName).toStrictEqual('my-definition')

  })


  it('Can create a reaction definition', async () => {
    const reactionsClient = Serialized.create(randomKeyConfig()).reactionsClient();
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
        reactionsClient.axiosClient,
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

    await reactionsClient.createOrUpdateReactionDefinition(reactionDefinition);
  });

})
