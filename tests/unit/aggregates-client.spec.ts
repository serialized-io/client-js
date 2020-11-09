import {v4 as uuidv4} from 'uuid';
import {EventEnvelope, Serialized} from "../../lib";
import {AggregatesClient} from "../../lib/AggregatesClient";
import {Game, GameCreated, GameStarted} from "./game";

const {randomKeyConfig, mockClient, mockPostOk, mockPost, mockGetOk} = require("./client-helpers");

describe('Aggregate client', () => {

  it('Can update aggregate using decorators', async () => {

    const gameClient = Serialized.create(randomKeyConfig()).aggregateClient(Game);
    const gameId = uuidv4();

    const expectedResponse = {
      aggregateVersion: 1,
      events: [{
        eventType: GameCreated.name,
        data: {
          gameId: gameId,
          startTime: 100
        }
      }]
    };

    mockClient(
        gameClient.axiosClient,
        [
          mockGetOk(RegExp(`^${(AggregatesClient.aggregateUrlPath('game', gameId))}$`), expectedResponse),
          mockPostOk(RegExp(`^${(AggregatesClient.aggregateEventsUrlPath('game', gameId))}$`), expectedResponse)
        ]);

    const startTime = Date.now();

    await gameClient.update(gameId, (game: Game) =>
        game.start(gameId, startTime))
  })

  it('Can load aggregate using decorators', async () => {

    const gameClient = Serialized.create(randomKeyConfig()).aggregateClient<Game>(Game);
    const gameId = uuidv4();

    const expectedResponse = {
      aggregateVersion: 1,
      events: [{
        eventType: GameCreated.name,
        data: {
          gameId: gameId,
          startTime: 100
        }
      }]
    };

    mockClient(
        gameClient.axiosClient,
        [mockGetOk(RegExp(`^${(AggregatesClient.aggregateUrlPath('game', gameId))}$`), expectedResponse)]);

    const game = await gameClient.load(gameId);
    const startEvents = game.start(gameId, 100);
    expect(startEvents.length).toStrictEqual(1);
  })

  it('Can create an aggregate using decorators', async () => {

    const gameClient = Serialized.create(randomKeyConfig()).aggregateClient<Game>(Game);
    const gameId = uuidv4();
    mockClient(
        gameClient.axiosClient,
        [mockPostOk(RegExp(`^${(AggregatesClient.aggregateEventsUrlPath('game', gameId))}$`))]);

    await gameClient.create(gameId, (game) => (
        game.create(gameId, Date.now())
    ));
  })

  it('Can store single events', async () => {

    const gameClient = Serialized.create(randomKeyConfig()).aggregateClient<Game>(Game);
    const gameId = uuidv4();

    mockClient(
        gameClient.axiosClient,
        [mockPostOk(RegExp(`^${(AggregatesClient.aggregateEventsUrlPath('game', gameId))}$`))]);

    const creationTime = Date.now();
    await gameClient.recordEvent(gameId, new GameCreated(gameId, creationTime));
  })

  it('Can store events', async () => {

    const gameClient = Serialized.create(randomKeyConfig()).aggregateClient<Game>(Game);
    const gameId = uuidv4();

    mockClient(
        gameClient.axiosClient,
        [mockPostOk(RegExp(`^${(AggregatesClient.aggregateEventsUrlPath('game', gameId))}$`))]);

    const creationTime = Date.now();
    await gameClient.recordEvents(gameId,
        [
          new GameCreated(gameId, creationTime),
          new GameStarted(gameId, creationTime)]
    );
  })

  it('Can use commit to use custom expectedVersion', async () => {

        const gameClient = Serialized.create(randomKeyConfig()).aggregateClient<Game>(Game);
        const gameId = uuidv4();

        const encryptedData = 'some-secret-stuff';
        const expectedVersion = 1;

        mockClient(
            gameClient.axiosClient,
            [mockPost(
                RegExp(`^${(AggregatesClient.aggregateEventsUrlPath('game', gameId))}$`),
                (config) => {
                  const payload = JSON.parse(config.data);
                  expect(payload.encryptedData).toStrictEqual(encryptedData);
                  expect(payload.expectedVersion).toStrictEqual(expectedVersion);
                  return [200, {}]
                }
            )]);
        const creationTime = Date.now();
        await gameClient.commit(gameId, (game) => {
          return {
            events: [EventEnvelope.fromDomainEvent(new GameCreated(gameId, creationTime))],
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

        const client = Serialized.create(randomKeyConfig()).aggregateClient<AggregateWithoutInitialState>(AggregateWithoutInitialState)
        const expectedResponse = {
          events: [
            EventEnvelope.fromDomainEvent(new SampleEvent())
          ]
        };

        const aggregateId = uuidv4();
        mockClient(
            client.axiosClient,
            [mockGetOk(RegExp(`^${(AggregatesClient.aggregateUrlPath('aggregate-type', aggregateId))}$`), expectedResponse),
              mockPostOk(RegExp(`^${(AggregatesClient.aggregateEventsUrlPath('aggregate-type', aggregateId))}$`))]);

        await client.update(aggregateId, (aggregate) => {
          expect(aggregate.state).toStrictEqual({handled: true})
          return []
        })
      }
  )


});
