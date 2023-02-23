import {v4 as uuidv4} from 'uuid';
import {LoadAggregateResponse, Serialized} from "../../lib";
import {isConflict, isSerializedApiError} from "../../lib/error";
import {LinearRetryStrategy} from "../../lib/RetryStrategy";
import {createGameClient, Game, GameEvent} from "./game/game";
import nock = require("nock");

const {randomKeyConfig, mockSerializedApiCalls} = require("./client-helpers");

describe('Aggregate client retry support', () => {

  afterEach(function () {
    nock.cleanAll()
  })

  it('Can retry up to retryCount', async () => {

    const config = randomKeyConfig();
    const serialized = Serialized.create(config)
    const gameClient = createGameClient(serialized, new LinearRetryStrategy(3, 500));
    const aggregateId = uuidv4();
    const expectedResponse: LoadAggregateResponse<GameEvent> = {
      aggregateVersion: 1,
      hasMore: false,
      aggregateId: aggregateId,
      events: [{
        eventId: uuidv4(),
        eventType: 'GameCreated',
        data: {
          gameId: aggregateId,
          creationTime: 100
        }
      }]
    };

    mockSerializedApiCalls(config)
        .get(gameClient.aggregateUrlPath(aggregateId))
        .query({since: '0', limit: '1000'})
        .reply(200, expectedResponse)
        .post(gameClient.aggregateEventsUrlPath(aggregateId))
        .reply(409)
        .get(gameClient.aggregateUrlPath(aggregateId))
        .query({since: '0', limit: '1000'})
        .reply(200, expectedResponse)
        .post(gameClient.aggregateEventsUrlPath(aggregateId))
        .reply(409)
        .get(gameClient.aggregateUrlPath(aggregateId))
        .query({since: '0', limit: '1000'})
        .reply(200, expectedResponse)
        .post(gameClient.aggregateEventsUrlPath(aggregateId))
        .reply(200)

    const startTime = Date.now();
    const eventCount = await gameClient.update({aggregateId}, (game: Game) => game.start(startTime))
    expect(eventCount).toStrictEqual(1)
  })

  it('Default is no retries', async () => {

    const config = randomKeyConfig();
    const serialized = Serialized.create(config)
    const gameClient = createGameClient(serialized);
    const aggregateId = uuidv4();
    const expectedResponse: LoadAggregateResponse<GameEvent> = {
      aggregateVersion: 1,
      hasMore: false,
      aggregateId: aggregateId,
      events: [{
        eventId: uuidv4(),
        eventType: 'GameCreated',
        data: {
          gameId: aggregateId,
          creationTime: 100
        }
      }]
    };

    mockSerializedApiCalls(config)
        .get(gameClient.aggregateUrlPath(aggregateId))
        .query({since: '0', limit: '1000'})
        .reply(200, expectedResponse)
        .post(gameClient.aggregateEventsUrlPath(aggregateId))
        .reply(409)

    const startTime = Date.now();
    try {
      await gameClient.update({aggregateId}, (game: Game) => game.start(startTime))
      fail()
    } catch (error) {
      if (isSerializedApiError(error)) {
        expect(error.statusCode).toBe(409)
      } else {
        fail()
      }
    }

  })

  it('Fail after last retry', async () => {

    const config = randomKeyConfig();
    const serialized = Serialized.create(config)
    const gameClient = createGameClient(serialized, new LinearRetryStrategy(2, 500));
    const aggregateId = uuidv4();
    const expectedResponse: LoadAggregateResponse<GameEvent> = {
      aggregateVersion: 1,
      hasMore: false,
      aggregateId: aggregateId,
      events: [{
        eventId: uuidv4(),
        eventType: 'GameCreated',
        data: {
          gameId: aggregateId,
          creationTime: 100
        }
      }]
    };

    mockSerializedApiCalls(config)
        .get(gameClient.aggregateUrlPath(aggregateId))
        .query({since: '0', limit: '1000'})
        .reply(200, expectedResponse)
        .post(gameClient.aggregateEventsUrlPath(aggregateId))
        .reply(409)
        .get(gameClient.aggregateUrlPath(aggregateId))
        .query({since: '0', limit: '1000'})
        .reply(200, expectedResponse)
        .post(gameClient.aggregateEventsUrlPath(aggregateId))
        .reply(409)
        .get(gameClient.aggregateUrlPath(aggregateId))
        .query({since: '0', limit: '1000'})
        .reply(200, expectedResponse)
        .post(gameClient.aggregateEventsUrlPath(aggregateId))
        .reply(409)

    const startTime = Date.now();
    try {
      await gameClient.update({aggregateId}, (game: Game) => game.start(startTime))
      fail()
    } catch (error) {
      if (isSerializedApiError(error)) {
        expect(error.statusCode).toBe(409)
      } else {
        fail()
      }
    }

  })

  it('Fail with 409', async () => {

    const config = randomKeyConfig();
    const serialized = Serialized.create(config)
    const gameClient = createGameClient(serialized, new LinearRetryStrategy(2, 500));

    const aggregateId = uuidv4();
    const expectedResponse: LoadAggregateResponse<GameEvent> = {
      aggregateVersion: 1,
      hasMore: false,
      aggregateId: aggregateId,
      events: [{
        eventId: uuidv4(),
        eventType: 'GameCreated',
        data: {
          gameId: aggregateId,
          creationTime: 100
        }
      }]
    };

    mockSerializedApiCalls(config)
        .get(gameClient.aggregateUrlPath(aggregateId))
        .query({since: '0', limit: '1000'})
        .reply(200, expectedResponse)
        .post(gameClient.aggregateEventsUrlPath(aggregateId))
        .reply(409)
        .get(gameClient.aggregateUrlPath(aggregateId))
        .query({since: '0', limit: '1000'})
        .reply(200, expectedResponse)
        .post(gameClient.aggregateEventsUrlPath(aggregateId))
        .reply(409)
        .get(gameClient.aggregateUrlPath(aggregateId))
        .query({since: '0', limit: '1000'})
        .reply(200, expectedResponse)
        .post(gameClient.aggregateEventsUrlPath(aggregateId))
        .reply(409)

    const startTime = Date.now();
    try {
      await gameClient.update({aggregateId}, (game: Game) => game.start(startTime))
      fail()
    } catch (error) {
      expect(isConflict(error)).toBe(true)
    }

  })

});
