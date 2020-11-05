import {DomainEvent} from "../../lib";
import {Aggregate, EventHandler} from "../../lib/decorators";

enum GameStatus {
  UNDEFINED = 'UNDEFINED',
  CREATED = 'CREATED',
  STARTED = 'STARTED',
  FINISHED = 'FINISHED'
}

type GameState = {
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

  get initialState(): GameState {
    return {
      status: GameStatus.UNDEFINED
    }
  }

  @EventHandler(GameCreated)
  handleGameCreated(event: GameCreated, state: GameState): GameState {
    return {...state, gameId: state.gameId, status: GameStatus.CREATED};
  }

  @EventHandler(GameStarted)
  handleGameStarted(event: GameStarted, state: GameState): GameState {
    return {...state, status: GameStatus.STARTED};
  }

}

class InvalidGameStatusException extends Error {
  constructor(expected: GameStatus, actual: GameStatus) {
    super(`Game status is not valid: [expected: ${expected}, actual: ${actual}]`);
  }
}

@Aggregate('game', GameStateBuilder)
class Game {

  constructor(private readonly state: GameState) {
  }

  create(gameId: string, creationTime: number) {
    const currentStatus = this.state.status;
    if (currentStatus == GameStatus.UNDEFINED) {
      return [new GameCreated(gameId, creationTime)];
    } else if (currentStatus == GameStatus.CREATED) {
      return [];
    } else {
      throw new InvalidGameStatusException(GameStatus.UNDEFINED, currentStatus);
    }
  }

  start(gameId: string, startTime: number): DomainEvent[] {
    return [new GameStarted(gameId, startTime)];
  }

}

export {Game, GameStateBuilder, GameState, GameStatus, GameStarted, GameCreated, GameFinished}
