import {
  HttpAction,
  LoadReactionDefinitionResponse,
  LoadScheduledReactionsResponse,
  ReactionsClient,
  Serialized
} from "../../lib";
import {v4 as uuidv4} from 'uuid';

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


  it('Can provide signing secret', async () => {
    const reactionsClient = Serialized.create(randomKeyConfig()).reactionsClient();
    const signingSecret = 'some-secret-value';
    const sendEmailAction: HttpAction = {
      actionType: 'HTTP_POST',
      targetUri: 'https://some-email-service',
      signingSecret
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
            mock.onPut(matcher).reply(async (config) => {
              await new Promise((resolve) => setTimeout(resolve, 300));
              expect(JSON.parse(config.data).action.signingSecret).toStrictEqual(signingSecret)
              return [200, reactionDefinition];
            });
          }
        ]);

    await reactionsClient.createOrUpdateReactionDefinition(reactionDefinition);
  })

  it('Can list scheduled reactions for multi-tenant project', async () => {
    const reactionsClient = Serialized.create(randomKeyConfig()).reactionsClient();
    const tenantId = uuidv4();
    const response: LoadScheduledReactionsResponse = {
      reactions: [
        {
          eventId: uuidv4(),
          aggregateId: uuidv4(),
          reactionName: 'send-email',
          reactionId: uuidv4(),
          aggregateType: 'notification',
          createdAt: 0,
          triggerAt: 0
        }
      ]
    }
    mockClient(
        reactionsClient.axiosClient,
        [
          (mock) => {
            const matcher = RegExp(`^${(ReactionsClient.scheduledReactionsUrl())}$`);
            mock.onGet(matcher).reply(async (config) => {
              await new Promise((resolve) => setTimeout(resolve, 300));
              expect(config.headers['Serialized-Tenant-Id']).toStrictEqual(tenantId)
              return [200, response];
            });
          }
        ]);

    await reactionsClient.listScheduledReactions({tenantId});
  })

  it('Can delete scheduled reactions for multi-tenant project', async () => {
    const reactionsClient = Serialized.create(randomKeyConfig()).reactionsClient();
    const reactionId = uuidv4();
    const tenantId = uuidv4();

    mockClient(
        reactionsClient.axiosClient,
        [
          (mock) => {
            const matcher = RegExp(`^${(ReactionsClient.scheduledReactionUrl(reactionId))}$`);
            mock.onDelete(matcher).reply(async (config) => {
              await new Promise((resolve) => setTimeout(resolve, 300));
              expect(config.headers['Serialized-Tenant-Id']).toStrictEqual(tenantId)
              return [200];
            });
          }
        ]);

    await reactionsClient.deleteScheduledReaction({reactionId}, {tenantId});
  })

  it('Can delete triggered reactions for multi-tenant project', async () => {
    const reactionsClient = Serialized.create(randomKeyConfig()).reactionsClient();
    const reactionId = uuidv4();
    const tenantId = uuidv4();

    mockClient(
        reactionsClient.axiosClient,
        [
          (mock) => {
            const matcher = RegExp(`^${(ReactionsClient.triggeredReactionUrl(reactionId))}$`);
            mock.onDelete(matcher).reply(async (config) => {
              await new Promise((resolve) => setTimeout(resolve, 300));
              expect(config.headers['Serialized-Tenant-Id']).toStrictEqual(tenantId)
              return [200];
            });
          }
        ]);

    await reactionsClient.deleteTriggeredReaction({reactionId}, {tenantId});
  })

  it('Can re-trigger reactions for multi-tenant project', async () => {
    const reactionsClient = Serialized.create(randomKeyConfig()).reactionsClient();
    const reactionId = uuidv4();
    const tenantId = uuidv4();

    mockClient(
        reactionsClient.axiosClient,
        [
          (mock) => {
            const matcher = RegExp(`^${(ReactionsClient.triggeredReactionUrl(reactionId))}$`);
            mock.onPost(matcher).reply(async (config) => {
              await new Promise((resolve) => setTimeout(resolve, 300));
              expect(config.headers['Serialized-Tenant-Id']).toStrictEqual(tenantId)
              return [200];
            });
          }
        ]);

    await reactionsClient.reExecuteTriggeredReaction({reactionId}, {tenantId});
  })

})
