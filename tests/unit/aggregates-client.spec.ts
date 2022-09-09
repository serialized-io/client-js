import {v4 as uuidv4} from 'uuid';
import {AggregatesClient, DomainEvent, EventBatch, LoadAggregateResponse, Serialized} from "../../lib";
import {Game, GameCreated, GameStarted} from "./game";
import nock = require("nock");

const {randomKeyConfig, mockSerializedApiCalls} = require("./client-helpers");

describe('Aggregate client', () => {

  afterEach(function () {
    nock.cleanAll()
  })

  it('Can update aggregate using decorators', async () => {

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

    const path = AggregatesClient.aggregateUrlPath(aggregateType, aggregateId);
    mockSerializedApiCalls(config)
        .get(path)
        .query({since: '0', limit: '1000'})
        .reply(200, expectedResponse)
        .post(AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId), (request) => {
          expect(request.events[0].eventType).toStrictEqual('GameStarted')
          expect(request.events[0].data).toStrictEqual({gameId: aggregateId, startTime})
          return true
        })

    const startTime = Date.now();
    const eventCount = await aggregatesClient.update(aggregateId, (game: Game) => game.start(startTime))
    expect(eventCount).toStrictEqual(1)
  })

  it('Can fully hydrate an aggregate', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient<Game>(Game);
    const aggregateType = 'game';
    const aggregateId = uuidv4();
    const expectedResponse1: LoadAggregateResponse = {
      aggregateVersion: 1,
      hasMore: true,
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

    const expectedResponse2: LoadAggregateResponse = {
      aggregateVersion: 2,
      hasMore: false,
      aggregateId: aggregateId,
      events: [{
        eventId: uuidv4(),
        eventType: GameStarted.name,
        data: {
          gameId: aggregateId,
          startTime: 100
        }
      }]
    };

    const path = AggregatesClient.aggregateUrlPath(aggregateType, aggregateId);
    mockSerializedApiCalls(config)
        .get(path)
        .query({since: '0', limit: '1'})
        .reply(200, expectedResponse1)
        .get(path)
        .query({since: '1', limit: '1'})
        .reply(200, expectedResponse2)

    const game = await aggregatesClient.load(aggregateId, {
      limit: 1
    })

    const cancelEvents = game.cancel(100);
    expect(cancelEvents.length).toStrictEqual(1);
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

    const path = AggregatesClient.aggregateUrlPath(aggregateType, aggregateId);
    mockSerializedApiCalls(config, tenantId)
        .get(path)
        .query({since: '0', limit: '1000'})
        .reply(200, expectedResponse)
        .post(AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId), (request) => {
          expect(request.events[0].eventType).toStrictEqual('GameStarted')
          expect(request.events[0].data).toStrictEqual({gameId: aggregateId, startTime})
          return true
        })

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

  it('Can load aggregate using decorators', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient<Game>(Game);
    const aggregateType = 'game';
    const aggregateId = uuidv4();

    const expectedResponse: LoadAggregateResponse = {
      aggregateVersion: 1,
      hasMore: false,
      aggregateId,
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

    const game = await aggregatesClient.load(aggregateId);
    const startEvents = game.start(100);
    expect(startEvents.length).toStrictEqual(1);
  })

  it('Can create an aggregate using decorators', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient<Game>(Game);
    const aggregateType = 'game';
    const aggregateId = uuidv4();
    const creationTime = Date.now();

    mockSerializedApiCalls(config)
        .post(AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId), (request) => {
          expect(request.expectedVersion).toStrictEqual(0)
          expect(request.events[0].eventType).toStrictEqual('GameCreated')
          expect(request.events[0].data).toStrictEqual({gameId: aggregateId, creationTime})
          return true
        })
        .reply(200)

    const eventCount = await aggregatesClient.create(aggregateId, (game) => (
        game.create(aggregateId, creationTime)
    ));
    expect(eventCount).toStrictEqual(1)
  })

  it('Can store single events', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient<Game>(Game);
    const aggregateType = 'game';
    const aggregateId = uuidv4();

    mockSerializedApiCalls(config)
        .post(AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId))
        .reply(200)

    const creationTime = Date.now();
    const eventCount = await aggregatesClient.recordEvent(aggregateId, DomainEvent.create(new GameCreated(aggregateId, creationTime)));
    expect(eventCount).toStrictEqual(1)
  })

  it('Can create two aggregates in bulk', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient<Game>(Game);
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

    const path = AggregatesClient.aggregateTypeEventsUrlPath(aggregateType);
    mockSerializedApiCalls(config)
        .post(path)
        .reply(200)

    const eventCount = await aggregatesClient.bulkSave(batches);
    expect(eventCount).toStrictEqual(2)
  })

  it('Can update two aggregates in bulk', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient<Game>(Game);
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
        .post(AggregatesClient.aggregateTypeEventsUrlPath(aggregateType))
        .reply(200)

    const eventCount = await aggregatesClient.bulkUpdate([aggregateId1, aggregateId2], (game) => game.start(Date.now()));
    expect(eventCount).toStrictEqual(2)
  })

  it('Can record single event for multi-tenant project ', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient<Game>(Game);
    const aggregateType = 'game';
    const aggregateId = uuidv4();
    const tenantId = uuidv4();

    mockSerializedApiCalls(config)
        .post(AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId))
        .reply(200)

    const creationTime = Date.now();
    const eventCount = await aggregatesClient.recordEvent(aggregateId, DomainEvent.create(new GameCreated(aggregateId, creationTime)), {tenantId});
    expect(eventCount).toStrictEqual(1)
  })

  it('Can record events', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient<Game>(Game);
    const aggregateType = 'game';
    const aggregateId = uuidv4();

    mockSerializedApiCalls(config)
        .post(AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId), (request) => {
          expect(request.expectedVersion).toStrictEqual(undefined)
          expect(request.events[0].data.gameId).toStrictEqual(aggregateId)
          expect(request.events[1].data.gameId).toStrictEqual(aggregateId)
          return true
        })
        .reply(200)

    const creationTime = Date.now();
    const eventCount = await aggregatesClient.recordEvents(aggregateId,
        [
          DomainEvent.create(new GameCreated(aggregateId, creationTime)),
          DomainEvent.create(new GameStarted(aggregateId, creationTime))]
    );
    expect(eventCount).toStrictEqual(2)
  })

  it('Can load aggregate for multi-tenant project', async () => {

    const config = randomKeyConfig();
    const gameClient = Serialized.create(config).aggregateClient<Game>(Game);
    const aggregateType = 'game';
    const aggregateId = uuidv4();
    const tenantId = uuidv4();

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

    await gameClient.load(aggregateId, {tenantId});
  })

  it('Can load aggregate with since and limit', async () => {

    const config = randomKeyConfig();
    const gameClient = Serialized.create(config).aggregateClient<Game>(Game);
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
        .query({since: '10', limit: '10'})
        .reply(200, expectedResponse)

    await gameClient.load(aggregateId, {since: 10, limit: 10});
  })

  it('Can create aggregate for multi-tenant project', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient<Game>(Game);
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

  it('Can check existence of aggregate', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient<Game>(Game);
    const aggregateType = 'game';
    const aggregateId = uuidv4();

    mockSerializedApiCalls(config)
        .head(AggregatesClient.aggregateUrlPath(aggregateType, aggregateId))
        .reply(200)

    const exists = await aggregatesClient.checkExists({aggregateId});
    expect(exists).toBe(true)
  })

  it('Can check existence of missing aggregate', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient<Game>(Game);
    const aggregateType = 'game';
    const aggregateId = uuidv4();

    mockSerializedApiCalls(config)
        .head(AggregatesClient.aggregateUrlPath(aggregateType, aggregateId))
        .reply(404)

    const exists = await aggregatesClient.checkExists({aggregateId});
    expect(exists).toBe(false)
  })

  it('Can save events for aggregate in multi-tenant project', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient<Game>(Game);
    const aggregateType = 'game';
    const aggregateId = uuidv4();
    const tenantId = uuidv4();

    mockSerializedApiCalls(config, tenantId)
        .post(AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId))
        .reply(200)

    const eventCount = await aggregatesClient.create(aggregateId, (game) => {
      return [DomainEvent.create(new GameCreated(aggregateId, 0))];
    }, {tenantId})
    expect(eventCount).toStrictEqual(1)
  })

  it('Can store event with encrypted data', async () => {

        const config = randomKeyConfig();
        const aggregatesClient = Serialized.create(config).aggregateClient<Game>(Game);
        const aggregateType = 'game';
        const encryptedData = 'some-secret-data';
        const aggregateId = uuidv4();

        const expectedVersion = 0;

        mockSerializedApiCalls(config)
            .post(AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId), request => {
              expect(request.expectedVersion).toStrictEqual(expectedVersion)
              expect(request.events[0].encryptedData).toStrictEqual(encryptedData)
              return true
            })
            .reply(200)

        const creationTime = Date.now();
        const eventCount = await aggregatesClient.create(aggregateId, (game) => {
          return [DomainEvent.create(new GameCreated(aggregateId, creationTime), encryptedData)]
        });
        expect(eventCount).toStrictEqual(1)
      }
  )

  it('Should not support empty aggregate type', async () => {

        class AggregateWithoutType {
        }

        expect(() => Serialized.create(randomKeyConfig()).aggregateClient<AggregateWithoutType>(AggregateWithoutType))
            .toThrowError();
      }
  )

  it('Should not support missing event handlers', async () => {

        class AggregateWithoutEventHandlers {
          aggregateType = 'aggregate-type'
        }

        expect(() => Serialized.create(randomKeyConfig()).aggregateClient<AggregateWithoutEventHandlers>(AggregateWithoutEventHandlers))
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
        const aggregatesClient = Serialized.create(config).aggregateClient<AggregateWithoutInitialState>(AggregateWithoutInitialState)
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
