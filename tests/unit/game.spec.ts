import {EventEnvelope, StateLoader} from "../../lib";
import {Game, GameCreated, GameFinished, GameStarted, GameState} from "./game";
import {v4 as uuidv4} from 'uuid';

describe('Game', () => {

  it('Should not start again when it has already been started', async () => {

    let gameId = uuidv4();

    let events = [
      new GameCreated(gameId, 0),
      new GameStarted(gameId, 100),
    ]

    let stateLoader = new StateLoader(Game);
    let gameState: GameState = stateLoader.loadState(events.map(EventEnvelope.fromDomainEvent));

    const game = new Game(gameState);
    const secondStart = game.start(gameId, 200);
    expect(secondStart).toStrictEqual([])
  })

  it('Should fail to create after it has been started', async () => {

    let gameId = uuidv4();

    let events = [
      new GameCreated(gameId, 0),
      new GameStarted(gameId, 100),
    ]

    let stateLoader = new StateLoader(Game);
    let gameState: GameState = stateLoader.loadState(events.map(EventEnvelope.fromDomainEvent));

    const game = new Game(gameState);
    expect(() => {
      game.create(gameId, 200);
    }).toThrow();

  })

  it('Should use default handler for GameFinished', async () => {

    let gameId = uuidv4();

    let events = [
      new GameCreated(gameId, 0),
      new GameStarted(gameId, 100),
      new GameFinished(gameId, 120),
    ]

    let stateLoader = new StateLoader(Game);
    stateLoader.loadState(events.map(EventEnvelope.fromDomainEvent));
  })

});
