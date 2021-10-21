import {v4 as uuidv4} from 'uuid';
import {AggregatesClient, EventEnvelope, LoadAggregateResponse, Serialized} from "../../lib";
import {Game, GameCreated, GameStarted} from "./game";
import nock = require("nock");

const {randomKeyConfig} = require("./client-helpers");

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
    nock('https://api.serialized.io')
        .get(path)
        .matchHeader('Serialized-Access-Key', config.accessKey)
        .matchHeader('Serialized-Secret-Access-Key', config.secretAccessKey)
        .reply(200, expectedResponse)
        .post(AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId))
        .matchHeader('Serialized-Access-Key', config.accessKey)
        .matchHeader('Serialized-Secret-Access-Key', config.secretAccessKey)
        .reply(200)
        .get(path)
        .reply(401)
        .post(path)
        .reply(401);

    const startTime = Date.now();
    const eventCount = await aggregatesClient.update(aggregateId, (game: Game) => game.start(aggregateId, startTime))
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

    const path = AggregatesClient.aggregateUrlPath(aggregateType, aggregateId);
    nock('https://api.serialized.io')
        .get(path)
        .matchHeader('Serialized-Access-Key', config.accessKey)
        .matchHeader('Serialized-Secret-Access-Key', config.secretAccessKey)
        .reply(200, expectedResponse)
        .get(path)
        .reply(401)

    const startTime = Date.now();
    const eventCount = await aggregatesClient.update(aggregateId, (game: Game) => game.start(aggregateId, startTime))
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

    const path = AggregatesClient.aggregateUrlPath(aggregateType, aggregateId);
    nock('https://api.serialized.io')
        .get(path)
        .matchHeader('Serialized-Access-Key', config.accessKey)
        .matchHeader('Serialized-Secret-Access-Key', config.secretAccessKey)
        .reply(200, expectedResponse)
        .get(path)
        .reply(401)

    const game = await aggregatesClient.load(aggregateId);
    const startEvents = game.start(aggregateId, 100);
    expect(startEvents.length).toStrictEqual(1);
  })

  it('Can create an aggregate using decorators', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient<Game>(Game);
    const aggregateType = 'game';
    const aggregateId = uuidv4();

    const path = AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId);
    nock('https://api.serialized.io')
        .post(path)
        .matchHeader('Serialized-Access-Key', config.accessKey)
        .matchHeader('Serialized-Secret-Access-Key', config.secretAccessKey)
        .reply(200)
        .post(path)
        .reply(401)

    const eventCount = await aggregatesClient.create(aggregateId, (game) => (
        game.create(aggregateId, Date.now())
    ));
    expect(eventCount).toStrictEqual(1)
  })

  it('Can store single events', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient<Game>(Game);
    const aggregateType = 'game';
    const aggregateId = uuidv4();

    const path = AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId);
    nock('https://api.serialized.io')
        .post(path)
        .matchHeader('Serialized-Access-Key', config.accessKey)
        .matchHeader('Serialized-Secret-Access-Key', config.secretAccessKey)
        .reply(200)
        .post(path)
        .reply(401)

    const creationTime = Date.now();
    const eventCount = await aggregatesClient.recordEvent(aggregateId, new GameCreated(aggregateId, creationTime));
    expect(eventCount).toStrictEqual(1)
  })

  it('Can record single event for multi-tenant project ', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient<Game>(Game);
    const aggregateType = 'game';
    const aggregateId = uuidv4();
    const tenantId = uuidv4();

    const path = AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId);
    nock('https://api.serialized.io')
        .post(path)
        .matchHeader('Serialized-Access-Key', config.accessKey)
        .matchHeader('Serialized-Secret-Access-Key', config.secretAccessKey)
        .matchHeader('Serialized-Tenant-Id', tenantId)
        .reply(200)
        .post(path)
        .reply(401)

    const creationTime = Date.now();
    const eventCount = await aggregatesClient.recordEvent(aggregateId, new GameCreated(aggregateId, creationTime), {tenantId});
    expect(eventCount).toStrictEqual(1)
  })

  it('Can store events', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient<Game>(Game);
    const aggregateType = 'game';
    const aggregateId = uuidv4();

    const path = AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId);
    nock('https://api.serialized.io')
        .post(path)
        .matchHeader('Serialized-Access-Key', config.accessKey)
        .matchHeader('Serialized-Secret-Access-Key', config.secretAccessKey)
        .reply(200)
        .post(path)
        .reply(401)

    const creationTime = Date.now();
    const eventCount = await aggregatesClient.recordEvents(aggregateId,
        [
          new GameCreated(aggregateId, creationTime),
          new GameStarted(aggregateId, creationTime)]
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
    const path = AggregatesClient.aggregateUrlPath(aggregateType, aggregateId);
    nock('https://api.serialized.io')
        .get(path)
        .matchHeader('Serialized-Access-Key', config.accessKey)
        .matchHeader('Serialized-Secret-Access-Key', config.secretAccessKey)
        .reply(200, expectedResponse)
        .get(path)
        .reply(401)

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
    const path = AggregatesClient.aggregateUrlPath(aggregateType, aggregateId);
    nock('https://api.serialized.io')
        .get(path)
        .matchHeader('Serialized-Access-Key', config.accessKey)
        .matchHeader('Serialized-Secret-Access-Key', config.secretAccessKey)
        .query({since: '10', limit: '10'})
        .reply(200, expectedResponse)
        .get(path)
        .reply(401)

    await gameClient.load(aggregateId, {since: 10, limit: 10});
  })

  it('Can create aggregate for multi-tenant project', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient<Game>(Game);
    const aggregateType = 'game';
    const aggregateId = uuidv4();
    const tenantId = uuidv4();

    const path = AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId);
    nock('https://api.serialized.io')
        .post(path)
        .matchHeader('Serialized-Access-Key', config.accessKey)
        .matchHeader('Serialized-Secret-Access-Key', config.secretAccessKey)
        .matchHeader('Serialized-Tenant-Id', tenantId)
        .reply(200)
        .get(path)
        .reply(401)

    const eventCount = await aggregatesClient.create(aggregateId, (game) => (
        game.create(aggregateId, Date.now())
    ), {tenantId});
    expect(eventCount).toStrictEqual(1)
  })

  it('Can save events for aggregate in multi-tenant project', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient<Game>(Game);
    const aggregateType = 'game';
    const aggregateId = uuidv4();
    const tenantId = uuidv4();

    const path = AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId);
    nock('https://api.serialized.io')
        .post(path)
        .matchHeader('Serialized-Access-Key', config.accessKey)
        .matchHeader('Serialized-Secret-Access-Key', config.secretAccessKey)
        .matchHeader('Serialized-Tenant-Id', tenantId)
        .reply(200)
        .get(path)
        .reply(401)

    const eventCount = await aggregatesClient.commit(aggregateId, (game) => {
      return {
        events: [EventEnvelope.fromDomainEvent(new GameCreated(aggregateId, 0))],
        expectedVersion: 0
      }
    }, {tenantId})
    expect(eventCount).toStrictEqual(1)
  })

  it('Can use commit to use custom expectedVersion', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient<Game>(Game);
    const aggregateType = 'game';
    const aggregateId = uuidv4();

    const encryptedData = 'some-secret-stuff';
    const expectedVersion = 1;

    const path = AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId)
    nock('https://api.serialized.io')
        .post(path, request => {
          expect(request.expectedVersion).toStrictEqual(expectedVersion)
          expect(request.encryptedData).toStrictEqual(encryptedData)
          return true
        })
        .matchHeader('Serialized-Access-Key', config.accessKey)
        .matchHeader('Serialized-Secret-Access-Key', config.secretAccessKey)
            .reply(200)
            .post(path)
            .reply(401)

        const creationTime = Date.now();
        const eventCount = await aggregatesClient.commit(aggregateId, (game) => {
          return {
            events: [EventEnvelope.fromDomainEvent(new GameCreated(aggregateId, creationTime))],
            expectedVersion,
            encryptedData
          }
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
            EventEnvelope.fromDomainEvent(new SampleEvent())
          ]
        };

        nock('https://api.serialized.io')
            .get(AggregatesClient.aggregateUrlPath(aggregateType, aggregateId))
            .matchHeader('Serialized-Access-Key', config.accessKey)
            .matchHeader('Serialized-Secret-Access-Key', config.secretAccessKey)
            .reply(200, expectedResponse)
            .get(AggregatesClient.aggregateUrlPath(aggregateType, aggregateId))
            .reply(401)
            .post(AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId))
            .matchHeader('Serialized-Access-Key', config.accessKey)
            .matchHeader('Serialized-Secret-Access-Key', config.secretAccessKey)
            .reply(200)
            .post(AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId))
            .reply(401)

        await aggregatesClient.update(aggregateId, (aggregate) => {
          expect(aggregate.state).toStrictEqual({handled: true})
          return []
        })
      }
  )


});
