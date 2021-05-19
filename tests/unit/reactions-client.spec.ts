import {
  HttpAction,
  LoadReactionDefinitionResponse,
  LoadScheduledReactionsResponse,
  ReactionsClient,
  Serialized
} from "../../lib";
import {v4 as uuidv4} from 'uuid';
import MockAdapter from "axios-mock-adapter";

const {
  randomKeyConfig,
  mockClient,
  assertMatchesSingleTenantRequestHeaders,
  assertMatchesMultiTenantRequestHeaders
} = require("./client-helpers");

describe('Reactions client', () => {

  it('Can get reaction definition', async () => {
    const config = randomKeyConfig();
    const reactionsClient = Serialized.create(config).reactionsClient()
    const reactionName = 'my-definition';
    const expectedResponse: LoadReactionDefinitionResponse = {
      reactionName,
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
          (mock: MockAdapter) => {
            mock.onGet(RegExp(`^${ReactionsClient.reactionDefinitionUrl(reactionName)}$`))
                .reply(async (request) => {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  assertMatchesSingleTenantRequestHeaders(request, config)
                  return [200, expectedResponse];
                });
          }
        ])

    const reactionDefinition = await reactionsClient.getReactionDefinition({reactionName});
    expect(reactionDefinition.reactionName).toStrictEqual(reactionName)
  })


  it('Can create a reaction definition', async () => {
    const config = randomKeyConfig();
    const reactionsClient = Serialized.create(config).reactionsClient();
    const reactionName = 'email-registered-user';
    const sendEmailAction: HttpAction = {
      actionType: 'HTTP_POST',
      targetUri: 'https://some-email-service'
    };
    const reactionDefinition = {
      reactionName,
      feedName: 'user-registration',
      reactOnEventType: 'UserRegistrationCompleted',
      action: sendEmailAction
    }

    mockClient(
        reactionsClient.axiosClient,
        [
          (mock: MockAdapter) => {
            mock.onPut(RegExp(`^${ReactionsClient.reactionDefinitionUrl(reactionName)}$`))
                .reply(async (request) => {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  assertMatchesSingleTenantRequestHeaders(request, config)
                  return [200, reactionDefinition];
                });
          }
        ]);

    await reactionsClient.createOrUpdateReactionDefinition(reactionDefinition);
  });

  it('Can provide signing secret', async () => {
    const config = randomKeyConfig();
    const reactionsClient = Serialized.create(config).reactionsClient();
    const signingSecret = 'some-secret-value';
    const reactionName = 'email-registered-user';
    const sendEmailAction: HttpAction = {
      actionType: 'HTTP_POST',
      targetUri: 'https://some-email-service',
      signingSecret
    };
    const reactionDefinition = {
      reactionName,
      feedName: 'user-registration',
      reactOnEventType: 'UserRegistrationCompleted',
      action: sendEmailAction
    }

    mockClient(
        reactionsClient.axiosClient,
        [
          (mock: MockAdapter) => {
            mock.onPut(RegExp(`^${ReactionsClient.reactionDefinitionUrl(reactionName)}$`))
                .reply(async (request) => {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  assertMatchesSingleTenantRequestHeaders(request, config)
                  expect(JSON.parse(request.data).action.signingSecret).toStrictEqual(signingSecret)
                  return [200, reactionDefinition];
                });
          }
        ]);

    await reactionsClient.createOrUpdateReactionDefinition(reactionDefinition);
  })

  it('Can list scheduled reactions for multi-tenant project', async () => {
    const config = randomKeyConfig();
    const reactionsClient = Serialized.create(config).reactionsClient();
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
          (mock: MockAdapter) => {
            mock.onGet(RegExp(`^${ReactionsClient.scheduledReactionsUrl()}$`))
                .reply(async (request) => {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  assertMatchesMultiTenantRequestHeaders(request, config, tenantId);
                  return [200, response];
                });
          }
        ]);

    await reactionsClient.listScheduledReactions({tenantId});
  })

  it('Can delete scheduled reactions for multi-tenant project', async () => {
    const config = randomKeyConfig();
    const reactionsClient = Serialized.create(config).reactionsClient();
    const reactionId = uuidv4();
    const tenantId = uuidv4();

    mockClient(
        reactionsClient.axiosClient,
        [
          (mock: MockAdapter) => {
            mock.onDelete(RegExp(`^${ReactionsClient.scheduledReactionUrl(reactionId)}$`))
                .reply(async (request) => {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  assertMatchesMultiTenantRequestHeaders(request, config, tenantId)
                  return [200];
                });
          }
        ]);

    await reactionsClient.deleteScheduledReaction({reactionId}, {tenantId});
  })

  it('Can delete triggered reactions for multi-tenant project', async () => {
    const config = randomKeyConfig();
    const reactionsClient = Serialized.create(config).reactionsClient();
    const reactionId = uuidv4();
    const tenantId = uuidv4();

    mockClient(
        reactionsClient.axiosClient,
        [
          (mock: MockAdapter) => {
            mock.onDelete(RegExp(`^${ReactionsClient.triggeredReactionUrl(reactionId)}$`))
                .reply(async (request) => {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  assertMatchesMultiTenantRequestHeaders(request, config, tenantId);
                  return [200];
                });
          }
        ]);

    await reactionsClient.deleteTriggeredReaction({reactionId}, {tenantId});
  })

  it('Can re-trigger reactions for multi-tenant project', async () => {
    const config = randomKeyConfig();
    const reactionsClient = Serialized.create(config).reactionsClient();
    const reactionId = uuidv4();
    const tenantId = uuidv4();

    mockClient(
        reactionsClient.axiosClient,
        [
          (mock: MockAdapter) => {
            mock.onPost(RegExp(`^${ReactionsClient.triggeredReactionUrl(reactionId)}$`))
                .reply(async (request) => {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  assertMatchesMultiTenantRequestHeaders(request, config, tenantId);
                  return [200];
                });
          }
        ]);

    await reactionsClient.reExecuteTriggeredReaction({reactionId}, {tenantId});
  })

})
