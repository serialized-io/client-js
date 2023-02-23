import {Game, GameCreated, GameEvent, GameFinished, GameStarted, GameState, stateBuilder} from "./game";
import {v4 as uuidv4} from 'uuid';
import {StateLoader} from "../../../lib/StateLoader";

describe('Game', () => {

  it('Should not start again when it has already been started', async () => {

    const gameId = uuidv4();

    const events: GameEvent[] = [
      {eventType: 'GameCreated', data: {gameId, creationTime: 0}},
      {eventType: 'GameStarted', data: {gameId, startTime: 100}},
    ]

    const gameState: GameState = new StateLoader<GameState, GameEvent>()
        .loadState(stateBuilder.initialState(), stateBuilder, events);

    const game = new Game(gameState);
    const secondStart = game.start(200);
    expect(secondStart).toStrictEqual([])
  })

  it('Should fail to create after it has been started', async () => {

    const gameId = uuidv4();
    const events = [
      {eventType: 'GameCreated', data: {gameId, creationTime: 0}} as GameCreated,
      {eventType: 'GameStarted', data: {gameId, startTime: 100}} as GameStarted,
    ]

    const gameState: GameState = new StateLoader<GameState, GameEvent>()
        .loadState(stateBuilder.initialState(), stateBuilder, events);

    const game = new Game(gameState);
    expect(() => {
      game.create(gameId, 200);
    }).toThrow();

  })

  it('Should use default handler for GameFinished', async () => {

    const gameId = uuidv4();

    const events = [
      {eventType: 'GameCreated', data: {gameId, creationTime: 0}} as GameCreated,
      {eventType: 'GameStarted', data: {gameId, startTime: 100}} as GameStarted,
      {eventType: 'GameFinished', data: {gameId, endTime: 200}} as GameFinished,
    ]

    new StateLoader<GameState, GameEvent>().loadState(stateBuilder.initialState(), stateBuilder, events);
  })
})
