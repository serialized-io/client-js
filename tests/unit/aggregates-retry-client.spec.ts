import {v4 as uuidv4} from 'uuid';
import {AggregatesClient, LoadAggregateResponse, Serialized} from "../../lib";
import {Game, GameCreated} from "./game";
import {isConflict, isSerializedApiError} from "../../lib/error";
import {LinearRetryStrategy} from "../../lib/RetryStrategy";
import nock = require("nock");

const {randomKeyConfig, mockSerializedApiCalls} = require("./client-helpers");

describe('Aggregate client retry support', () => {

  afterEach(function () {
    nock.cleanAll()
  })

  it('Can retry up to retryCount', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient(Game, {
      retryStrategy: new LinearRetryStrategy(3, 500)
    });
    const aggregateType = 'game';
    const aggregateId = uuidv4();
    const expectedResponse: LoadAggregateResponse = {
      aggregateVersion: 1,
      hasMore: false,
      aggregateId: aggregateId,
      events: [{
        eventId: uuidv4(),
        eventType: GameCreated.name,
        data: {
          gameId: aggregateId,
          startTime: 100
        }
      }]
    };

    mockSerializedApiCalls(config)
        .get(AggregatesClient.aggregateUrlPath(aggregateType, aggregateId))
        .query({since: '0', limit: '1000'})
        .reply(200, expectedResponse)
        .post(AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId))
        .reply(409)
        .get(AggregatesClient.aggregateUrlPath(aggregateType, aggregateId))
        .query({since: '0', limit: '1000'})
        .reply(200, expectedResponse)
        .post(AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId))
        .reply(409)
        .get(AggregatesClient.aggregateUrlPath(aggregateType, aggregateId))
        .query({since: '0', limit: '1000'})
        .reply(200, expectedResponse)
        .post(AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId))
        .reply(200)

    const startTime = Date.now();
    const eventCount = await aggregatesClient.update({aggregateId}, (game: Game) => game.start(startTime))
    expect(eventCount).toStrictEqual(1)
  })

  it('Default is no retries', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient(Game);
    const aggregateType = 'game';
    const aggregateId = uuidv4();
    const expectedResponse: LoadAggregateResponse = {
      aggregateVersion: 1,
      hasMore: false,
      aggregateId: aggregateId,
      events: [{
        eventId: uuidv4(),
        eventType: GameCreated.name,
        data: {
          gameId: aggregateId,
          startTime: 100
        }
      }]
    };

    mockSerializedApiCalls(config)
        .get(AggregatesClient.aggregateUrlPath(aggregateType, aggregateId))
        .query({since: '0', limit: '1000'})
        .reply(200, expectedResponse)
        .post(AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId))
        .reply(409)

    const startTime = Date.now();
    try {
      await aggregatesClient.update({aggregateId}, (game: Game) => game.start(startTime))
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
    const aggregatesClient = Serialized.create(config).aggregateClient(Game, {
      retryStrategy: new LinearRetryStrategy(2, 500)
    });
    const aggregateType = 'game';
    const aggregateId = uuidv4();
    const expectedResponse: LoadAggregateResponse = {
      aggregateVersion: 1,
      hasMore: false,
      aggregateId: aggregateId,
      events: [{
        eventId: uuidv4(),
        eventType: GameCreated.name,
        data: {
          gameId: aggregateId,
          startTime: 100
        }
      }]
    };

    mockSerializedApiCalls(config)
        .get(AggregatesClient.aggregateUrlPath(aggregateType, aggregateId))
        .query({since: '0', limit: '1000'})
        .reply(200, expectedResponse)
        .post(AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId))
        .reply(409)
        .get(AggregatesClient.aggregateUrlPath(aggregateType, aggregateId))
        .query({since: '0', limit: '1000'})
        .reply(200, expectedResponse)
        .post(AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId))
        .reply(409)
        .get(AggregatesClient.aggregateUrlPath(aggregateType, aggregateId))
        .query({since: '0', limit: '1000'})
        .reply(200, expectedResponse)
        .post(AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId))
        .reply(409)

    const startTime = Date.now();
    try {
      await aggregatesClient.update({aggregateId}, (game: Game) => game.start(startTime))
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
    const aggregatesClient = Serialized.create(config).aggregateClient(Game, {
      retryStrategy: new LinearRetryStrategy(2, 500)
    });
    const aggregateType = 'game';
    const aggregateId = uuidv4();
    const expectedResponse: LoadAggregateResponse = {
      aggregateVersion: 1,
      hasMore: false,
      aggregateId: aggregateId,
      events: [{
        eventId: uuidv4(),
        eventType: GameCreated.name,
        data: {
          gameId: aggregateId,
          startTime: 100
        }
      }]
    };

    mockSerializedApiCalls(config)
        .get(AggregatesClient.aggregateUrlPath(aggregateType, aggregateId))
        .query({since: '0', limit: '1000'})
        .reply(200, expectedResponse)
        .post(AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId))
        .reply(409)
        .get(AggregatesClient.aggregateUrlPath(aggregateType, aggregateId))
        .query({since: '0', limit: '1000'})
        .reply(200, expectedResponse)
        .post(AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId))
        .reply(409)
        .get(AggregatesClient.aggregateUrlPath(aggregateType, aggregateId))
        .query({since: '0', limit: '1000'})
        .reply(200, expectedResponse)
        .post(AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId))
        .reply(409)

    const startTime = Date.now();
    try {
      await aggregatesClient.update({aggregateId}, (game: Game) => game.start(startTime))
      fail()
    } catch (error) {
      expect(isConflict(error)).toBe(true)
    }

  })

});
