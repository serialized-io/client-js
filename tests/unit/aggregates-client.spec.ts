import {v4 as uuidv4} from 'uuid';
import {AggregatesClient, DomainEvent, EventBatch, LoadAggregateResponse, Serialized} from "../../lib";
import {Game, GameCreated, GameStarted} from "./game";
import nock = require("nock");

const {randomKeyConfig, mockSerializedApiCalls} = require("./client-helpers");

describe('Aggregate client', () => {

  afterEach(function () {
    nock.cleanAll()
  })

  it('Can update aggregate', async () => {

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
        .post(AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId), (request) => {
          const event = request.events[0];
          return request.expectedVersion === 1 &&
              event.eventType === 'GameStarted' &&
              event.data.gameId === aggregateId &&
              event.data.startTime === startTime
        })
        .reply(200)

    const startTime = Date.now();
    const eventCount = await aggregatesClient.update(aggregateId, (game: Game) => game.start(startTime))
    expect(eventCount).toStrictEqual(1)
  })

  it('Can update aggregate with encrypted data', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient(Game);
    const aggregateType = 'game';
    const aggregateId = uuidv4();
    const encryptedData = 'encrypted-data';
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
        },
        encryptedData
      }]
    };

    mockSerializedApiCalls(config)
        .get(AggregatesClient.aggregateUrlPath(aggregateType, aggregateId))
        .query({since: '0', limit: '1000'})
        .reply(200, expectedResponse)
        .post(AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId), (request) => {
          const event = request.events[0];
          return request.expectedVersion === 1 &&
              event.eventType === 'GameStarted' &&
              event.data.gameId === aggregateId &&
              event.data.startTime === startTime &&
              event.encryptedData === encryptedData
        })
        .reply(200)

    const startTime
        = Date.now();
    const eventCount = await aggregatesClient.update(aggregateId, (game: Game) => game.start(startTime, encryptedData))
    expect(eventCount).toStrictEqual(1)
  })

  it('Can update aggregate without expectedVersion', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient(Game);
    const aggregateType = 'game';
    const aggregateId = uuidv4();
    const encryptedData = 'encrypted-data';
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
        .post(AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId), (request) => {
          const event = request.events[0];
          return request.expectedVersion === undefined &&
              event.eventType === 'GameStarted' &&
              event.data.gameId === aggregateId &&
              event.data.startTime === startTime
        })
        .reply(200)

    const startTime = Date.now();
    const eventCount = await aggregatesClient.update(aggregateId, (game: Game) => game.start(startTime, encryptedData), {
      useOptimisticConcurrency: false
    })
    expect(eventCount).toStrictEqual(1)
  })

  it('Can update aggregate for tenant', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient(Game);
    const aggregateType = 'game';
    const tenantId = uuidv4();
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

    mockSerializedApiCalls(config, tenantId)
        .get(AggregatesClient.aggregateUrlPath(aggregateType, aggregateId))
        .query({since: '0', limit: '1000'})
        .reply(200, expectedResponse)
        .post(AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId), (request) => {
          return request.expectedVersion === 1 &&
              request.events[0].eventType === 'GameStarted' &&
              request.events[0].data.gameId === aggregateId &&
              request.events[0].data.startTime === startTime
        })
        .reply(200)


    const startTime = Date.now();
    const eventCount = await aggregatesClient.update(aggregateId, (game: Game) => game.start(startTime), {
      tenantId
    })
    expect(eventCount).toStrictEqual(1)
  })

  it('Does not update aggregate if zero events', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient(Game);
    const aggregateType = 'game';
    const aggregateId = uuidv4();
    const expectedResponse: LoadAggregateResponse = {
      aggregateVersion: 2,
      hasMore: false,
      aggregateId: aggregateId,
      events: [{
        eventId: uuidv4(),
        eventType: GameCreated.name,
        data: {
          gameId: aggregateId,
          creationTime: 100
        }
      }, {
        eventId: uuidv4(),
        eventType: GameStarted.name,
        data: {
          gameId: aggregateId,
          startTime: 200
        }
      }]
    };

    mockSerializedApiCalls(config)
        .get(AggregatesClient.aggregateUrlPath(aggregateType, aggregateId))
        .query({since: '0', limit: '1000'})
        .reply(200, expectedResponse)

    const startTime = Date.now();
    const eventCount = await aggregatesClient.update(aggregateId, (game: Game) => game.start(startTime))
    expect(eventCount).toStrictEqual(0)
  })

  it('Can create an aggregate using decorators', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient(Game);
    const aggregateType = 'game';
    const aggregateId = uuidv4();
    const creationTime = Date.now();

    mockSerializedApiCalls(config)
        .post(AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId), (request) => {
          return request.expectedVersion === 0
              && request.events[0].eventType === 'GameCreated'
              && request.events[0].data.gameId === aggregateId
              && request.events[0].data.creationTime === creationTime
        })
        .reply(200)

    const eventCount = await aggregatesClient.create(aggregateId, (game) => (
        game.create(aggregateId, creationTime)
    ));
    expect(eventCount).toStrictEqual(1)
  })

  it('Can save an aggregate', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient(Game);
    const aggregateType = 'game';
    const aggregateId = uuidv4();
    const creationTime = Date.now();

    const event: DomainEvent<any> = {
      eventId: '',
      eventType: 'GameCreated',
      data: {
        gameId: aggregateId,
        creationTime
      }
    }

    mockSerializedApiCalls(config)
        .post(AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId), (request) => {
          return request.expectedVersion === 0
              && request.events[0].eventType === 'GameCreated'
              && request.events[0].data.gameId === aggregateId
              && request.events[0].data.creationTime === creationTime
        })
        .reply(200)

    const eventCount = await aggregatesClient.save({aggregateId, events: [event], expectedVersion: 0});
    expect(eventCount).toStrictEqual(1)
  })

  it('Can save an aggregate with encrypted data', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient(Game);
    const aggregateType = 'game';
    const aggregateId = uuidv4();
    const creationTime = Date.now();

    const encryptedData = 'encrypted-data';
    const event: DomainEvent<any> = {
      eventId: '',
      eventType: 'GameCreated',
      data: {
        gameId: aggregateId,
        creationTime
      },
      encryptedData
    }

    mockSerializedApiCalls(config)
        .post(AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId), (request) => {
          const event = request.events[0];
          return request.expectedVersion === 0
              && event.eventType === 'GameCreated'
              && event.data.gameId === aggregateId
              && event.data.creationTime === creationTime
              && event.encryptedData === encryptedData
        })
        .reply(200)

    const eventCount = await aggregatesClient.save({aggregateId, events: [event], expectedVersion: 0});
    expect(eventCount).toStrictEqual(1)
  })

  it('Can save bulk events for aggregate', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient(Game);
    const aggregateType = 'game';
    const aggregateId = uuidv4();
    const creationTime = Date.now();

    const event: DomainEvent<any> = {
      eventId: '',
      eventType: 'GameCreated',
      data: {
        gameId: aggregateId,
        creationTime
      }
    }

    mockSerializedApiCalls(config)
        .post(AggregatesClient.aggregateTypeBulkEventsUrlPath(aggregateType), (request) => {
          let batch = request.batches[0];
          return batch.aggregateId === aggregateId
              && batch.events[0].eventType === 'GameCreated'
              && batch.events[0].data.gameId === aggregateId
              && batch.events[0].data.creationTime === creationTime
              && batch.expectedVersion === 0
        })
        .reply(200)

    const eventCount = await aggregatesClient.saveBulk({batches: [{aggregateId, events: [event], expectedVersion: 0}]});
    expect(eventCount).toStrictEqual(1)
  })

  it('Can create two aggregates in bulk', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient(Game);
    const aggregateType = 'game';
    const creationTime = Date.now();
    const aggregateId1 = uuidv4()
    const aggregateId2 = uuidv4()
    const batches: EventBatch[] = [
      {
        aggregateId: aggregateId1,
        events: [DomainEvent.create(new GameCreated(aggregateId1, creationTime))],
        expectedVersion: 0
      },
      {
        aggregateId: aggregateId2,
        events: [DomainEvent.create(new GameCreated(aggregateId2, creationTime))],
        expectedVersion: 0
      }
    ];

    const path = AggregatesClient.aggregateTypeBulkEventsUrlPath(aggregateType);
    mockSerializedApiCalls(config)
        .post(path, (request) => {
          return request.batches.length === 2
        })
        .reply(200)

    const eventCount = await aggregatesClient.bulkSave(batches);
    expect(eventCount).toStrictEqual(2)
  })

  it('Can update two aggregates in bulk', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient(Game);
    const aggregateType = 'game';

    const aggregateId1 = uuidv4()
    const aggregateId2 = uuidv4()
    const expectedResponse1: LoadAggregateResponse = {
      hasMore: false,
      aggregateId: aggregateId1,
      aggregateVersion: 1,
      events: [
        DomainEvent.create(new GameCreated(aggregateId1, Date.now()))
      ]
    };

    const expectedResponse2: LoadAggregateResponse = {
      hasMore: false,
      aggregateId: aggregateId2,
      aggregateVersion: 1,
      events: [
        DomainEvent.create(new GameCreated(aggregateId2, Date.now()))
      ]
    };

    mockSerializedApiCalls(config)
        .get(AggregatesClient.aggregateUrlPath(aggregateType, aggregateId1))
        .query({since: '0', limit: '1000'})
        .reply(200, expectedResponse1)
        .get(AggregatesClient.aggregateUrlPath(aggregateType, aggregateId2))
        .query({since: '0', limit: '1000'})
        .reply(200, expectedResponse2)
        .post(AggregatesClient.aggregateTypeBulkEventsUrlPath(aggregateType))
        .reply(200)

    const eventCount = await aggregatesClient.bulkUpdate([aggregateId1, aggregateId2], (game) => game.start(Date.now()));
    expect(eventCount).toStrictEqual(2)
  })

  it('Can create aggregate for multi-tenant project', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient(Game);
    const aggregateType = 'game';
    const aggregateId = uuidv4();
    const tenantId = uuidv4();
    const creationTime = Date.now();

    mockSerializedApiCalls(config, tenantId)
        .post(AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId), (request) => {
          expect(request.expectedVersion).toStrictEqual(0)
          expect(request.events[0].eventType).toStrictEqual('GameCreated')
          expect(request.events[0].data).toStrictEqual({gameId: aggregateId, creationTime})
          return true
        })
        .reply(200)

    const eventCount = await aggregatesClient.create(aggregateId, (game) => (
        game.create(aggregateId, creationTime)), {tenantId});
    expect(eventCount).toStrictEqual(1)
  })

  it('Can delete a single aggregate', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient(Game);
    const aggregateType = 'game';
    const aggregateId = uuidv4();

    const tokenResponse = {
      token: 'abc-123'
    }

    mockSerializedApiCalls(config)
        .delete(AggregatesClient.aggregateUrlPath(aggregateType, aggregateId), (request) => {
          return true
        })
        .reply(200, tokenResponse)
        .delete(AggregatesClient.aggregateUrlPath(aggregateType, aggregateId), (request) => {
          return true
        })
        .query({deleteToken: 'abc-123'})
        .reply(200)

    const {token} = await aggregatesClient.delete({aggregateId});
    await aggregatesClient.confirmDelete({aggregateId, token});
  })

  it('Can delete an aggregate type', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient(Game);
    const aggregateType = 'game';

    const tokenResponse = {
      token: 'abc-123'
    }

    mockSerializedApiCalls(config)
        .delete(AggregatesClient.aggregateTypeUrlPath(aggregateType), (request) => {
          return true
        })
        .reply(200, tokenResponse)
        .delete(AggregatesClient.aggregateTypeUrlPath(aggregateType), (request) => {
          return true
        })
        .query({deleteToken: 'abc-123'})
        .reply(200)

    const {token} = await aggregatesClient.delete();
    await aggregatesClient.confirmDelete({token});
  })

  it('Can check existence of aggregate', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient(Game);
    const aggregateType = 'game';
    const aggregateId = uuidv4();

    mockSerializedApiCalls(config)
        .head(AggregatesClient.aggregateUrlPath(aggregateType, aggregateId))
        .reply(200)

    const exists = await aggregatesClient.exists({aggregateId});
    expect(exists).toBe(true)
  })

  it('Can check existence of aggregate for multi-tenant project', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient(Game);
    const aggregateType = 'game';
    const aggregateId = uuidv4();
    const tenantId = uuidv4();

    mockSerializedApiCalls(config, tenantId)
        .head(AggregatesClient.aggregateUrlPath(aggregateType, aggregateId))
        .reply(200)

    const exists = await aggregatesClient.exists({aggregateId}, {tenantId});
    expect(exists).toBe(true)
  })

  it('Can check existence of missing aggregate', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient(Game);
    const aggregateType = 'game';
    const aggregateId = uuidv4();

    mockSerializedApiCalls(config)
        .head(AggregatesClient.aggregateUrlPath(aggregateType, aggregateId))
        .reply(404)

    const exists = await aggregatesClient.exists({aggregateId});
    expect(exists).toBe(false)
  })

  it('Can check existence of missing aggregate for multi-tenant project', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient(Game);
    const aggregateType = 'game';
    const aggregateId = uuidv4();
    const tenantId = uuidv4();

    mockSerializedApiCalls(config, tenantId)
        .head(AggregatesClient.aggregateUrlPath(aggregateType, aggregateId))
        .reply(404)

    const exists = await aggregatesClient.exists({aggregateId}, {tenantId});
    expect(exists).toBe(false)
  })

  it('Should not support empty aggregate type', async () => {

        class AggregateWithoutType {
        }

    expect(() => Serialized.create(randomKeyConfig()).aggregateClient(AggregateWithoutType))
            .toThrowError();
      }
  )

  it('Should not support missing event handlers', async () => {

        class AggregateWithoutEventHandlers {
          aggregateType = 'aggregate-type'
        }

    expect(() => Serialized.create(randomKeyConfig()).aggregateClient(AggregateWithoutEventHandlers))
            .toThrowError();
      }
  )

  it('Uses empty object as default initial state', async () => {

        class SampleEvent {
        }

        class AggregateWithoutInitialState {
          state: any;
          aggregateType = 'aggregate-type'

          constructor(state) {
            this.state = state;
          }

          get eventHandlers() {
            return {
              SampleEvent(state, event) {
                return {...state, handled: true}
              }
            }
          }
        }

        const config = randomKeyConfig();
        const aggregatesClient = Serialized.create(config).aggregateClient(AggregateWithoutInitialState)
        const aggregateType = 'aggregate-type';
        const aggregateId = uuidv4();
        const expectedResponse: LoadAggregateResponse = {
          hasMore: false,
          aggregateId,
          aggregateVersion: 1,
          events: [
            DomainEvent.create(new SampleEvent())
          ]
        };

        mockSerializedApiCalls(config)
            .get(AggregatesClient.aggregateUrlPath(aggregateType, aggregateId))
            .query({since: '0', limit: '1000'})
            .reply(200, expectedResponse)
            .post(AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId))
            .reply(200)

        await aggregatesClient.update(aggregateId, (aggregate) => {
          expect(aggregate.state).toStrictEqual({handled: true})
          return []
        })
      }
  )


});
