import {
  HttpAction,
  ListReactionsResponse,
  LoadReactionDefinitionResponse,
  ReactionsClient,
  Serialized
} from "../../lib";
import {v4 as uuidv4} from 'uuid';
import nock = require("nock");

const {randomKeyConfig, mockSerializedApiCalls} = require("./client-helpers");

describe('Reactions client', () => {

  afterEach(function () {
    nock.cleanAll()
  })

  it('Can get reaction definition', async () => {
    const config = randomKeyConfig();
    const reactionsClient = Serialized.create(config).reactionsClient()
    const reactionName = 'my-definition';
    const expectedResponse: LoadReactionDefinitionResponse = {
      reactionName,
      feedName: 'todos',
      description: 'This is a description',
      reactOnEventType: '',
      action: {
        actionType: "HTTP_POST",
        targetUri: 'https://example.com/test-reaction'
      }
    }

    mockSerializedApiCalls(config)
      .get(ReactionsClient.reactionDefinitionUrl(reactionName))
      .reply(200, expectedResponse)

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

    mockSerializedApiCalls(config)
      .put(ReactionsClient.reactionDefinitionUrl(reactionName))
      .reply(200)

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

    mockSerializedApiCalls(config)
      .put(ReactionsClient.reactionDefinitionUrl(reactionName), request => {
        expect(request.action.signingSecret).toStrictEqual(signingSecret)
        return true
      })
      .reply(200, reactionDefinition)

    await reactionsClient.createOrUpdateReactionDefinition(reactionDefinition);
  })

  it('Can list reactions for multi-tenant project', async () => {
    const config = randomKeyConfig();
    const reactionsClient = Serialized.create(config).reactionsClient();
    const tenantId = uuidv4();
    const response: ListReactionsResponse = {
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

    mockSerializedApiCalls(config, tenantId)
      .get(ReactionsClient.reactionsUrl())
      .reply(200, response)

    await reactionsClient.listReactions({tenantId});
  })

  it('Can list reactions by status', async () => {
    const config = randomKeyConfig();
    const reactionsClient = Serialized.create(config).reactionsClient();
    const tenantId = uuidv4();
    const response: ListReactionsResponse = {
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

    mockSerializedApiCalls(config, tenantId)
      .get(ReactionsClient.reactionsUrl())
      .query({status: 'COMPLETED'})
      .reply(200, response)

    await reactionsClient.listReactions({tenantId, status: 'COMPLETED'});
  })

  it('Can delete reactions for multi-tenant project', async () => {
    const config = randomKeyConfig();
    const reactionsClient = Serialized.create(config).reactionsClient();
    const reactionId = uuidv4();
    const tenantId = uuidv4();

    mockSerializedApiCalls(config, tenantId)
      .delete(ReactionsClient.reactionUrl(reactionId))
      .reply(200)

    await reactionsClient.deleteReaction({reactionId}, {tenantId});
  })

  it('Can delete reactions', async () => {
    const config = randomKeyConfig();
    const reactionsClient = Serialized.create(config).reactionsClient();
    const reactionId = uuidv4();

    mockSerializedApiCalls(config)
      .delete(ReactionsClient.reactionUrl(reactionId))
      .reply(200)

    await reactionsClient.deleteReaction({reactionId});
  })

  it('Can execute reactions for multi-tenant project', async () => {
    const config = randomKeyConfig();
    const reactionsClient = Serialized.create(config).reactionsClient();
    const reactionId = uuidv4();
    const tenantId = uuidv4();

    mockSerializedApiCalls(config, tenantId)
      .post(ReactionsClient.reactionExecutionUrl(reactionId))
      .reply(200)

    await reactionsClient.executeReaction({reactionId}, {tenantId});
  })

  it('Can execute reactions', async () => {
    const config = randomKeyConfig();
    const reactionsClient = Serialized.create(config).reactionsClient();
    const reactionId = uuidv4();

    mockSerializedApiCalls(config)
      .post(ReactionsClient.reactionExecutionUrl(reactionId))
      .reply(200)

    await reactionsClient.executeReaction({reactionId});
  })

})
