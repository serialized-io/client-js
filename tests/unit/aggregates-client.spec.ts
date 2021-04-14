import {v4 as uuidv4} from 'uuid';
import {AggregatesClient, EventEnvelope, LoadAggregateResponse, Serialized} from "../../lib";
import {Game, GameCreated, GameStarted} from "./game";

const {
  randomKeyConfig,
  mockClient,
  assertMatchesSingleTenantRequestHeaders,
  assertMatchesMultiTenantRequestHeaders
} = require("./client-helpers");

describe('Aggregate client', () => {

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

    mockClient(
        aggregatesClient.axiosClient,
        [
          (mock) => {
            mock.onGet(RegExp(`^${AggregatesClient.aggregateUrlPath(aggregateType, aggregateId)}$`))
                .reply(async (request) => {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  assertMatchesSingleTenantRequestHeaders(request, config)
                  return [200, expectedResponse];
                });
          },
          (mock) => {
            mock.onPost(RegExp(`^${AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId)}$`))
                .reply(async (request) => {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  assertMatchesSingleTenantRequestHeaders(request, config)
                  return [200];
                });
          }
        ])

    const startTime = Date.now();
    await aggregatesClient.update(aggregateId, (game: Game) =>
        game.start(aggregateId, startTime))
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


    mockClient(
        aggregatesClient.axiosClient,
        [
          (mock) => {
            mock.onGet(RegExp(`^${AggregatesClient.aggregateUrlPath(aggregateType, aggregateId)}$`))
                .reply(async (request) => {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  assertMatchesSingleTenantRequestHeaders(request, config)
                  return [200, expectedResponse];
                });
          }
        ])

    const game = await aggregatesClient.load(aggregateId);
    const startEvents = game.start(aggregateId, 100);
    expect(startEvents.length).toStrictEqual(1);
  })

  it('Can create an aggregate using decorators', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient<Game>(Game);
    const aggregateType = 'game';
    const aggregateId = uuidv4();

    mockClient(
        aggregatesClient.axiosClient,
        [
          (mock) => {
            mock.onPost(RegExp(`^${AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId)}$`))
                .reply(async (request) => {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  assertMatchesSingleTenantRequestHeaders(request, config)
                  return [200];
                });
          }
        ])

    await aggregatesClient.create(aggregateId, (game) => (
        game.create(aggregateId, Date.now())
    ));
  })

  it('Can store single events', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient<Game>(Game);
    const aggregateType = 'game';
    const aggregateId = uuidv4();

    mockClient(
        aggregatesClient.axiosClient,
        [
          (mock) => {
            mock.onPost(RegExp(`^${AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId)}$`))
                .reply(async (request) => {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  assertMatchesSingleTenantRequestHeaders(request, config)
                  return [200];
                });
          }
        ])

    const creationTime = Date.now();
    await aggregatesClient.recordEvent(aggregateId, new GameCreated(aggregateId, creationTime));
  })

  it('Can store events', async () => {

    const config = randomKeyConfig();
    const aggregatesClient = Serialized.create(config).aggregateClient<Game>(Game);
    const aggregateType = 'game';
    const aggregateId = uuidv4();

    mockClient(
        aggregatesClient.axiosClient,
        [
          (mock) => {
            mock.onPost(RegExp(`^${AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId)}$`))
                .reply(async (request) => {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  assertMatchesSingleTenantRequestHeaders(request, config)
                  return [200];
                });
          }
        ])

    const creationTime = Date.now();
    await aggregatesClient.recordEvents(aggregateId,
        [
          new GameCreated(aggregateId, creationTime),
          new GameStarted(aggregateId, creationTime)]
    );
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

    mockClient(
        gameClient.axiosClient,
        [
          (mock) => {
            mock.onGet(RegExp(`^${AggregatesClient.aggregateUrlPath(aggregateType, aggregateId)}$`))
                .reply(async (request) => {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  assertMatchesMultiTenantRequestHeaders(request, config, tenantId)
                  return [200, expectedResponse];
                });
          }
        ]);

    await gameClient.load(aggregateId, {tenantId});
  })

  it('Can use commit to use custom expectedVersion', async () => {

        const config = randomKeyConfig();
        const aggregatesClient = Serialized.create(config).aggregateClient<Game>(Game);
        const aggregateType = 'game';
        const aggregateId = uuidv4();

        const encryptedData = 'some-secret-stuff';
        const expectedVersion = 1;


        mockClient(
            aggregatesClient.axiosClient,
            [
              (mock) => {
                mock.onPost(RegExp(`^${AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId)}$`))
                    .reply(async (request) => {
                      await new Promise((resolve) => setTimeout(resolve, 300));
                      assertMatchesSingleTenantRequestHeaders(request, config)
                      const payload = JSON.parse(request.data);
                      expect(payload.encryptedData).toStrictEqual(encryptedData);
                      expect(payload.expectedVersion).toStrictEqual(expectedVersion);
                      return [200];
                    });
              }
            ])

        const creationTime = Date.now();
        await aggregatesClient.commit(aggregateId, (game) => {
          return {
            events: [EventEnvelope.fromDomainEvent(new GameCreated(aggregateId, creationTime))],
            expectedVersion,
            encryptedData
          }
        });
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

        mockClient(
            aggregatesClient.axiosClient,
            [
              (mock) => {
                mock.onGet(RegExp(`^${AggregatesClient.aggregateUrlPath(aggregateType, aggregateId)}$`))
                    .reply(async (request) => {
                      await new Promise((resolve) => setTimeout(resolve, 300));
                      assertMatchesSingleTenantRequestHeaders(request, config)
                      return [200, expectedResponse];
                    });
              },
              (mock) => {
                mock.onPost(RegExp(`^${AggregatesClient.aggregateEventsUrlPath(aggregateType, aggregateId)}$`))
                    .reply(async (request) => {
                      await new Promise((resolve) => setTimeout(resolve, 300));
                      assertMatchesSingleTenantRequestHeaders(request, config)
                      return [200];
                    });
              }
            ])

    await aggregatesClient.update(aggregateId, (aggregate) => {
      expect(aggregate.state).toStrictEqual({handled: true})
      return []
    })
      }
  )


});
