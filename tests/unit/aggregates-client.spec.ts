import {Serialized, SerializedInstance} from "../../lib";
import {AggregatesClient} from "../../lib/AggregatesClient";
import {Game, GameCreated, GameStarted} from "./game";

const uuidv4 = require("uuid").v4;
const {randomKeyConfig, mockClient, mockPostOk, mockGetOk} = require("./client-helpers");

describe('Aggregate client', () => {

  it('Can update aggregate using decorators', async () => {

    const serialized: SerializedInstance = Serialized.create(randomKeyConfig())
    const gameClient = serialized.aggregateClient(Game, {});
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

    const events = await gameClient.update(gameId, (game: Game) => {
      return game.start(gameId, startTime);
    });

    expect(events[0].eventType).toBe(GameStarted.name)
    expect(events[0].data).toStrictEqual(new GameStarted(gameId, startTime))
  })

  it('Can load aggregate using decorators', async () => {

    const serialized: SerializedInstance = Serialized.create(randomKeyConfig())
    const gameClient = serialized.aggregateClient<Game>(Game, {});
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

    const serialized: SerializedInstance = Serialized.create(randomKeyConfig())
    const gameClient = serialized.aggregateClient<Game>(Game, {});
    const gameId = uuidv4();

    mockClient(
        gameClient.axiosClient,
        [mockPostOk(RegExp(`^${(AggregatesClient.aggregateEventsUrlPath('game', gameId))}$`))]);

    const creationTime = Date.now();
    const events = await gameClient.create(gameId, (game) => {
      return game.create(gameId, creationTime);
    });

    expect(events.length).toStrictEqual(1);
  })

  it('Can store single events', async () => {

    const serialized: SerializedInstance = Serialized.create(randomKeyConfig())
    const gameClient = serialized.aggregateClient<Game>(Game, {});
    const gameId = uuidv4();

    mockClient(
        gameClient.axiosClient,
        [mockPostOk(RegExp(`^${(AggregatesClient.aggregateEventsUrlPath('game', gameId))}$`))]);

    const creationTime = Date.now();
    const events = await gameClient.storeEvent(gameId, new GameCreated(gameId, creationTime));
    expect(events.length).toStrictEqual(1);
  })

  it('Can store events', async () => {

    const serialized: SerializedInstance = Serialized.create(randomKeyConfig())
    const gameClient = serialized.aggregateClient<Game>(Game, {});
    const gameId = uuidv4();

    mockClient(
        gameClient.axiosClient,
        [mockPostOk(RegExp(`^${(AggregatesClient.aggregateEventsUrlPath('game', gameId))}$`))]);

    const creationTime = Date.now();
    const events = await gameClient.storeEvents(gameId, [
      new GameCreated(gameId, creationTime),
      new GameStarted(gameId, creationTime)
    ]);
    expect(events.length).toStrictEqual(2);
  })

})
