import {v4 as uuidv4} from 'uuid';
import {EventBatch, LoadAggregateResponse, SaveBulkPayload, Serialized} from "../../lib";
import {createGameClient, createSafeGameClient, Game, GameCreated, GameEvent} from "./game/game";
import {UnhandledEventTypeError} from "../../lib/error";
import nock = require("nock");

const {randomKeyConfig, mockSerializedApiCalls} = require("./client-helpers");

describe('Aggregate client', () => {

  afterEach(function () {
    nock.cleanAll()
  })

  it('Can update aggregate', async () => {

    const config = randomKeyConfig();
    const serialized = Serialized.create(config);
    const gameClient = createSafeGameClient(serialized);

    const aggregateId = 'd1de7667-12f8-4bf6-9b7c-9589eaee16d4'
    const expectedResponse = {
      aggregateVersion: 1,
      hasMore: false,
      aggregateId: aggregateId,
      events: [{
        eventId: '824d0e46-7ffd-4667-9117-f57f73a73844',
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
        .post(gameClient.aggregateEventsUrlPath(aggregateId), (request) => {
          const event = request.events[0];
          return request.expectedVersion === 1 &&
              event.eventType === 'GameStarted' &&
              event.data.gameId === aggregateId &&
              event.data.startTime === startTime
        })
        .reply(200)

    const startTime = Date.now();
    const eventCount = await gameClient.update({aggregateId}, (game: Game) => game.start(startTime))
    expect(eventCount).toStrictEqual(1)
  })

  it('Can update aggregate with unhandled event in state', async () => {

    const config = randomKeyConfig();
    const serialized = Serialized.create(config);
    const gameClient = createSafeGameClient(serialized);

    const aggregateId = 'd1de7667-12f8-4bf6-9b7c-9589eaee16d4'
    const expectedResponse = {
      aggregateVersion: 1,
      hasMore: false,
      aggregateId: aggregateId,
      events: [
        {
          eventId: '824d0e46-7ffd-4667-9117-f57f73a73844',
          eventType: 'GameCreated',
          data: {
            gameId: aggregateId,
            creationTime: 100
          }
        },
        {
          eventId: '824d0e46-0000-4667-9117-f57f73a73844',
          eventType: 'GameTimeSet',
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
        .post(gameClient.aggregateEventsUrlPath(aggregateId), (request) => {
          const event = request.events[0];
          return request.expectedVersion === 1 &&
              event.eventType === 'GameStarted' &&
              event.data.gameId === aggregateId &&
              event.data.startTime === startTime
        })
        .reply(200)

    const startTime = Date.now();
    const eventCount = await gameClient.update({aggregateId}, (game: Game) => game.start(startTime))
    expect(eventCount).toStrictEqual(1)
  })

  it('Should throw error for unhandled event', async () => {

    const config = randomKeyConfig();
    const serialized = Serialized.create(config);
    const gameClient = createGameClient(serialized);

    const aggregateId = 'd1de7667-12f8-4bf6-9b7c-9589eaee16d4'
    const expectedResponse = {
      aggregateVersion: 1,
      hasMore: false,
      aggregateId: aggregateId,
      events: [
        {
          eventId: '824d0e46-7ffd-4667-9117-f57f73a73844',
          eventType: 'GameCreated',
          data: {
            gameId: aggregateId,
            creationTime: 100
          }
        },
        {
          eventId: '824d0e46-0000-4667-9117-f57f73a73844',
          eventType: 'GameTimeSet',
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

    try {
      await gameClient.update({aggregateId}, (game: Game) => game.start(Date.now()))
      fail()
    } catch (e) {
      if (!(e instanceof UnhandledEventTypeError)) {
        fail()
      }
    }
  })

  it('Can update aggregate with encrypted data', async () => {

    const config = randomKeyConfig();
    const serialized = Serialized.create(config);
    const gameClient = createGameClient(serialized);
    const aggregateId = uuidv4();
    const encryptedData = 'encrypted-data';
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
        },
        encryptedData
      }]
    };

    mockSerializedApiCalls(config)
        .get(gameClient.aggregateUrlPath(aggregateId))
        .query({since: '0', limit: '1000'})
        .reply(200, expectedResponse)
        .post(gameClient.aggregateEventsUrlPath(aggregateId), (request) => {
          const event = request.events[0];
          return request.expectedVersion === 1 &&
              event.eventType === 'GameStarted' &&
              event.data.gameId === aggregateId &&
              event.data.startTime === startTime &&
              event.encryptedData === encryptedData
        })
        .reply(200)

    const startTime = Date.now();
    const eventCount = await gameClient.update({aggregateId}, (game: Game) => game.start(startTime, encryptedData))
    expect(eventCount).toStrictEqual(1)
  })

  it('Can update aggregate without expectedVersion', async () => {

    const config = randomKeyConfig();
    const serialized = Serialized.create(config)
    const gameClient = createGameClient(serialized);
    const aggregateId = uuidv4();
    const encryptedData = 'encrypted-data';
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
        .post(gameClient.aggregateEventsUrlPath(aggregateId), (request) => {
          const event = request.events[0];
          return request.expectedVersion === undefined &&
              event.eventType === 'GameStarted' &&
              event.data.gameId === aggregateId &&
              event.data.startTime === startTime
        })
        .reply(200)

    const startTime = Date.now();
    const eventCount = await gameClient.update({
      aggregateId,
      useOptimisticConcurrency: false
    }, (game: Game) => game.start(startTime, encryptedData),)
    expect(eventCount).toStrictEqual(1)
  })

  it('Can update aggregate for tenant', async () => {

    const config = randomKeyConfig();
    const serialized = Serialized.create(config)
    const gameClient = createGameClient(serialized);
    const tenantId = uuidv4();
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

    mockSerializedApiCalls(config, tenantId)
        .get(gameClient.aggregateUrlPath(aggregateId))
        .query({since: '0', limit: '1000'})
        .reply(200, expectedResponse)
        .post(gameClient.aggregateEventsUrlPath(aggregateId), (request) => {
          return request.expectedVersion === 1 &&
              request.events[0].eventType === 'GameStarted' &&
              request.events[0].data.gameId === aggregateId &&
              request.events[0].data.startTime === startTime
        })
        .reply(200)


    const startTime = Date.now();
    const eventCount = await gameClient.update({aggregateId, tenantId}, (game: Game) => game.start(startTime))
    expect(eventCount).toStrictEqual(1)
  })

  it('Does not update aggregate if zero events', async () => {

    const config = randomKeyConfig();
    const serialized = Serialized.create(config)
    const gameClient = createGameClient(serialized);
    const aggregateId = uuidv4();
    const expectedResponse: LoadAggregateResponse<GameEvent> = {
      aggregateVersion: 2,
      hasMore: false,
      aggregateId: aggregateId,
      events: [{
        eventId: uuidv4(),
        eventType: 'GameCreated',
        data: {
          gameId: aggregateId,
          creationTime: 100
        }
      }, {
        eventId: uuidv4(),
        eventType: 'GameStarted',
        data: {
          gameId: aggregateId,
          startTime: 200
        }
      }]
    };

    mockSerializedApiCalls(config)
        .get(gameClient.aggregateUrlPath(aggregateId))
        .query({since: '0', limit: '1000'})
        .reply(200, expectedResponse)

    const startTime = Date.now();
    const eventCount = await gameClient.update({aggregateId}, (game: Game) => game.start(startTime))
    expect(eventCount).toStrictEqual(0)
  })

  it('Can create an aggregate using decorators', async () => {

    const config = randomKeyConfig();
    const serialized = Serialized.create(config)
    const gameClient = createGameClient(serialized);
    const aggregateId = uuidv4();
    const creationTime = Date.now();

    mockSerializedApiCalls(config)
        .post(gameClient.aggregateEventsUrlPath(aggregateId), (request) => {
          return request.expectedVersion === 0
              && request.events[0].eventType === 'GameCreated'
              && request.events[0].data.gameId === aggregateId
              && request.events[0].data.creationTime === creationTime
        })
        .reply(200)

    const eventCount = await gameClient.create({aggregateId}, (game) => (
        game.create(aggregateId, creationTime)
    ));
    expect(eventCount).toStrictEqual(1)
  })

  it('Can save an aggregate', async () => {

    const config = randomKeyConfig();
    const serialized = Serialized.create(config)
    const gameClient = createGameClient(serialized);
    const aggregateId = uuidv4();
    const creationTime = Date.now();

    const event: GameCreated = {
      eventId: uuidv4(),
      eventType: 'GameCreated',
      data: {
        gameId: aggregateId,
        creationTime
      }
    }

    mockSerializedApiCalls(config)
        .post(gameClient.aggregateEventsUrlPath(aggregateId), (request) => {
          return request.expectedVersion === 0
              && request.events[0].eventType === 'GameCreated'
              && request.events[0].data.gameId === aggregateId
              && request.events[0].data.creationTime === creationTime
        })
        .reply(200)

    const eventCount = await gameClient.save({aggregateId, events: [event], expectedVersion: 0});
    expect(eventCount).toStrictEqual(1)
  })

  it('Can save an aggregate with encrypted data', async () => {

    const config = randomKeyConfig();
    const serialized = Serialized.create(config)
    const gameClient = createGameClient(serialized);
    const aggregateId = uuidv4();
    const creationTime = Date.now();

    const encryptedData = 'encrypted-data';
    const event: GameCreated = {
      eventId: uuidv4(),
      eventType: 'GameCreated',
      data: {
        gameId: aggregateId,
        creationTime
      },
      encryptedData
    }

    mockSerializedApiCalls(config)
        .post(gameClient.aggregateEventsUrlPath(aggregateId), (request) => {
          const event = request.events[0];
          return request.expectedVersion === 0
              && event.eventType === 'GameCreated'
              && event.data.gameId === aggregateId
              && event.data.creationTime === creationTime
              && event.encryptedData === encryptedData
        })
        .reply(200)

    const eventCount = await gameClient.save({aggregateId, events: [event], expectedVersion: 0});
    expect(eventCount).toStrictEqual(1)
  })

  it('Can save bulk events for aggregate', async () => {

    const config = randomKeyConfig();
    const serialized = Serialized.create(config)
    const gameClient = createGameClient(serialized);

    const aggregateId = uuidv4();
    const creationTime = Date.now();

    const event: GameCreated = {
      eventId: '',
      eventType: 'GameCreated',
      data: {
        gameId: aggregateId,
        creationTime
      }
    }

    mockSerializedApiCalls(config)
        .post(gameClient.aggregateTypeBulkEventsUrlPath, (request) => {
          let batch = request.batches[0];
          return batch.aggregateId === aggregateId
              && batch.events[0].eventType === 'GameCreated'
              && batch.events[0].data.gameId === aggregateId
              && batch.events[0].data.creationTime === creationTime
              && batch.expectedVersion === 0
        })
        .reply(200)

    const eventCount = await gameClient.bulkSave({batches: [{aggregateId, events: [event], expectedVersion: 0}]});
    expect(eventCount).toStrictEqual(1)
  })

  it('Can create two aggregates in bulk', async () => {

    const config = randomKeyConfig();
    const serialized = Serialized.create(config)
    const gameClient = createGameClient(serialized);

    const creationTime = Date.now();
    const aggregateId1 = uuidv4()
    const aggregateId2 = uuidv4()
    const batches: EventBatch<GameEvent>[] = [
      {
        aggregateId: aggregateId1,
        events: [{eventType: 'GameCreated', data: {gameId: aggregateId1, creationTime}} as GameCreated],
        expectedVersion: 0
      },
      {
        aggregateId: aggregateId2,
        events: [{eventType: 'GameCreated', data: {gameId: aggregateId2, creationTime}} as GameCreated],
        expectedVersion: 0
      }
    ];

    mockSerializedApiCalls(config)
        .post(gameClient.aggregateTypeBulkEventsUrlPath, (request) => {
          return request.batches.length === 2
        })
        .reply(200)

    const eventCount = await gameClient.bulkSave({batches});
    expect(eventCount).toStrictEqual(2)
  })

  it('Can update two aggregates in bulk', async () => {

    const config = randomKeyConfig();
    const serialized = Serialized.create(config)
    const gameClient = createGameClient(serialized);

    const aggregateId1 = uuidv4()
    const aggregateId2 = uuidv4()
    const expectedResponse1: LoadAggregateResponse<GameEvent> = {
      hasMore: false,
      aggregateId: aggregateId1,
      aggregateVersion: 1,
      events: [
        {eventType: 'GameCreated', data: {gameId: aggregateId1, creationTime: Date.now()}} as GameCreated
      ]
    };

    const expectedResponse2: LoadAggregateResponse<GameEvent> = {
      hasMore: false,
      aggregateId: aggregateId2,
      aggregateVersion: 1,
      events: [
        {eventType: 'GameCreated', data: {gameId: aggregateId2, creationTime: Date.now()}} as GameCreated
      ]
    };

    mockSerializedApiCalls(config)
        .get(gameClient.aggregateUrlPath(aggregateId1))
        .query({since: '0', limit: '1000'})
        .reply(200, expectedResponse1)
        .get(gameClient.aggregateUrlPath(aggregateId2))
        .query({since: '0', limit: '1000'})
        .reply(200, expectedResponse2)
        .post(gameClient.aggregateTypeBulkEventsUrlPath, (request: SaveBulkPayload<GameEvent>) => {

          expect(request.batches[0].aggregateId).toStrictEqual(aggregateId1)
          expect(request.batches[0].expectedVersion).toStrictEqual(1)
          expect(request.batches[0].events[0].eventType).toStrictEqual('GameStarted')

          expect(request.batches[1].aggregateId).toStrictEqual(aggregateId2)
          expect(request.batches[1].expectedVersion).toStrictEqual(1)
          expect(request.batches[1].events[0].eventType).toStrictEqual('GameStarted')
          return true
        })
        .reply(200)

    const eventCount = await gameClient.bulkUpdate({aggregateIds: [aggregateId1, aggregateId2]}, (game) => game.start(Date.now()));
    expect(eventCount).toStrictEqual(2)
  })

  it('Can create aggregate for multi-tenant project', async () => {

    const config = randomKeyConfig();
    const serialized = Serialized.create(config)
    const gameClient = createGameClient(serialized);
    const aggregateId = uuidv4();
    const tenantId = uuidv4();
    const creationTime = Date.now();

    mockSerializedApiCalls(config, tenantId)
        .post(gameClient.aggregateEventsUrlPath(aggregateId), (request) => {
          expect(request.expectedVersion).toStrictEqual(0)
          expect(request.events[0].eventType).toStrictEqual('GameCreated')
          expect(request.events[0].data).toStrictEqual({gameId: aggregateId, creationTime})
          return true
        })
        .reply(200)

    const eventCount = await gameClient.create({aggregateId, tenantId}, (game) => (
        game.create(aggregateId, creationTime)));
    expect(eventCount).toStrictEqual(1)
  })

  it('Can delete a single aggregate', async () => {

    const config = randomKeyConfig();
    const serialized = Serialized.create(config)
    const gameClient = createGameClient(serialized);
    const aggregateId = uuidv4();

    const tokenResponse = {
      token: 'abc-123'
    }

    mockSerializedApiCalls(config)
        .delete(gameClient.aggregateUrlPath(aggregateId), (request) => {
          return true
        })
        .reply(200, tokenResponse)
        .delete(gameClient.aggregateUrlPath(aggregateId), (request) => {
          return true
        })
        .query({deleteToken: 'abc-123'})
        .reply(200)

    const {token} = await gameClient.delete({aggregateId});
    await gameClient.confirmDelete({aggregateId, token});
  })

  it('Can delete an aggregate type', async () => {

    const config = randomKeyConfig();
    const serialized = Serialized.create(config)
    const gameClient = createGameClient(serialized);

    const tokenResponse = {
      token: 'abc-123'
    }

    mockSerializedApiCalls(config)
        .delete(gameClient.aggregateTypeUrlPath, (request) => {
          return true
        })
        .reply(200, tokenResponse)
        .delete(gameClient.aggregateTypeUrlPath, (request) => {
          return true
        })
        .query({deleteToken: 'abc-123'})
        .reply(200)

    const {token} = await gameClient.delete();
    await gameClient.confirmDelete({token});
  })

  it('Can check existence of aggregate', async () => {

    const config = randomKeyConfig();
    const serialized = Serialized.create(config)
    const gameClient = createGameClient(serialized);
    const aggregateId = uuidv4();

    mockSerializedApiCalls(config)
        .head(gameClient.aggregateUrlPath(aggregateId))
        .reply(200)

    const exists = await gameClient.exists({aggregateId});
    expect(exists).toBe(true)
  })

  it('Can check existence of aggregate for multi-tenant project', async () => {

    const config = randomKeyConfig();
    const serialized = Serialized.create(config)
    const gameClient = createGameClient(serialized);
    const aggregateId = uuidv4();
    const tenantId = uuidv4();

    mockSerializedApiCalls(config, tenantId)
        .head(gameClient.aggregateUrlPath(aggregateId))
        .reply(200)

    const exists = await gameClient.exists({aggregateId, tenantId});
    expect(exists).toBe(true)
  })

  it('Can check existence of missing aggregate', async () => {

    const config = randomKeyConfig();
    const serialized = Serialized.create(config)
    const gameClient = createGameClient(serialized);

    const aggregateId = uuidv4();

    mockSerializedApiCalls(config)
        .head(gameClient.aggregateUrlPath(aggregateId))
        .reply(404)

    const exists = await gameClient.exists({aggregateId});
    expect(exists).toBe(false)
  })

  it('Can check existence of missing aggregate for multi-tenant project', async () => {

    const config = randomKeyConfig();
    const serialized = Serialized.create(config)
    const gameClient = createGameClient(serialized);
    const aggregateId = uuidv4();
    const tenantId = uuidv4();

    mockSerializedApiCalls(config, tenantId)
        .head(gameClient.aggregateUrlPath(aggregateId))
        .reply(404)

    const exists = await gameClient.exists({aggregateId, tenantId});
    expect(exists).toBe(false)
  })

});
