import {DomainEvent} from "../../lib";
import {Aggregate, EventHandler} from "../../lib/decorators";

enum GameStatus {
  UNDEFINED = 'UNDEFINED',
  CREATED = 'CREATED',
  STARTED = 'STARTED',
  FINISHED = 'FINISHED'
}

class GameState {
  readonly gameId?: string;
  readonly status: GameStatus;
}

class GameCreated implements DomainEvent {
  constructor(readonly gameId: string,
              readonly creationTime: number) {
  };
}

class GameStarted implements DomainEvent {
  constructor(readonly gameId: string,
              readonly startTime: number) {
  };
}

class GameFinished implements DomainEvent {
  constructor(readonly gameId: string,
              readonly endTime: number) {
  };
}


class GameStateBuilder {

  @EventHandler(GameCreated)
  handleGameCreated(event: GameCreated, state: GameState): GameState {
    return {gameId: state.gameId, status: GameStatus.CREATED};
  }

}

@Aggregate('game', GameState, GameStateBuilder)
class Game {

  constructor(private readonly state: GameState) {
  }

  start(gameId: string, startTime: number): DomainEvent[] {
    return [new GameStarted(gameId, startTime)];
  }

  create(gameId: string, creationTime: number) {
    return [new GameCreated(gameId, creationTime)];
  }
}

export {Game, GameStateBuilder, GameState, GameStatus, GameStarted, GameCreated, GameFinished}
