import {v4 as uuidv4} from 'uuid';
import {Serialized} from "../../lib";
import {AggregatesClient} from "../../lib/AggregatesClient";
import {Game, GameCreated, GameStarted} from "./game";

const {randomKeyConfig, mockClient, mockPostOk, mockGetOk} = require("./client-helpers");

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
        ({events: game.start(gameId, startTime)}));

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
    let startEvents = game.start(gameId, 100);
    expect(startEvents.length).toStrictEqual(1);
  })

  it('Can create an aggregate using decorators', async () => {

    const gameClient = Serialized.create(randomKeyConfig()).aggregateClient<Game>(Game);
    const gameId = uuidv4();
    mockClient(
        gameClient.axiosClient,
        [mockPostOk(RegExp(`^${(AggregatesClient.aggregateEventsUrlPath('game', gameId))}$`))]);

    await gameClient.create(gameId, (game) => ({
      events: game.create(gameId, Date.now())
    }));
  })

  it('Can store single events', async () => {

    const gameClient = Serialized.create(randomKeyConfig()).aggregateClient<Game>(Game);
    const gameId = uuidv4();

    mockClient(
        gameClient.axiosClient,
        [mockPostOk(RegExp(`^${(AggregatesClient.aggregateEventsUrlPath('game', gameId))}$`))]);

    const creationTime = Date.now();
    await gameClient.storeEvent(gameId, new GameCreated(gameId, creationTime));
  })

  it('Can store events', async () => {

    const gameClient = Serialized.create(randomKeyConfig()).aggregateClient<Game>(Game);
    const gameId = uuidv4();

    mockClient(
        gameClient.axiosClient,
        [mockPostOk(RegExp(`^${(AggregatesClient.aggregateEventsUrlPath('game', gameId))}$`))]);

    const creationTime = Date.now();
    await gameClient.storeEvents(gameId, {
      events: [
        new GameCreated(gameId, creationTime),
        new GameStarted(gameId, creationTime)]
    });
  })

})
