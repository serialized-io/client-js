import {DefaultHandler, DomainEvent} from "../../lib";
import {Aggregate, EventHandler} from "../../lib/decorators";

enum GameStatus {
  UNDEFINED = 'UNDEFINED',
  CREATED = 'CREATED',
  STARTED = 'STARTED',
  CANCELED = 'CANCELED',
  FINISHED = 'FINISHED'
}

type GameState = {
  readonly gameId?: string;
  readonly status: GameStatus;
}

class GameCreated {
  constructor(readonly gameId: string,
              readonly creationTime: number) {
  };
}

class GameStarted {
  constructor(readonly gameId: string,
              readonly startTime: number) {
  };
}

class GameCanceled {
  constructor(readonly gameId: string,
              readonly cancelTime: number) {
  };
}

class GameFinished {
  constructor(readonly gameId: string,
              readonly endTime: number) {
  };
}


class GameStateBuilder {

  get initialState() {
    return () => ({
      status: GameStatus.UNDEFINED
    })
  }

  @EventHandler(GameCreated)
  handleGameCreated(state: GameState, event: DomainEvent<GameCreated>): GameState {
    console.log(event.data)
    return {...state, gameId: event.data.gameId, status: GameStatus.CREATED};
  }

  @EventHandler(GameStarted)
  handleGameStarted(state: GameState, event: DomainEvent<GameStarted>): GameState {
    console.log(event.data)
    return {...state, status: GameStatus.STARTED};
  }

  @EventHandler(GameCanceled)
  handleGameCanceled(state: GameState, event: DomainEvent<GameCanceled>): GameState {
    console.log(event.data)
    return {...state, status: GameStatus.CANCELED};
  }

  @DefaultHandler()
  handle(state: GameState, event: DomainEvent<any>): GameState {
    console.log('Default handler called for', event.eventType)
    return state
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
      return [DomainEvent.create(new GameCreated(gameId, creationTime))];
    } else if (currentStatus == GameStatus.CREATED) {
      return [];
    } else {
      throw new InvalidGameStatusException(GameStatus.UNDEFINED, currentStatus);
    }
  }

  start(startTime: number): DomainEvent<GameStarted>[] {
    const currentStatus = this.state.status;
    if (this.state.status == GameStatus.STARTED) {
      return [];
    } else if (this.state.status == GameStatus.CREATED) {
      return [DomainEvent.create(new GameStarted(this.state.gameId, startTime))];
    }
    throw new InvalidGameStatusException(GameStatus.CREATED, currentStatus);
  }

  cancel(cancelTime: number): DomainEvent<GameCanceled>[] {
    const currentStatus = this.state.status;
    if (this.state.status == GameStatus.CANCELED) {
      return [];
    } else if (this.state.status == GameStatus.STARTED) {
      return [DomainEvent.create(new GameCanceled(this.state.gameId, cancelTime))];
    }
    throw new InvalidGameStatusException(GameStatus.STARTED, currentStatus);
  }

  noop(): DomainEvent<any>[] {
    return []
  }

}

export {Game, GameStateBuilder, GameState, GameStatus, GameStarted, GameCreated, GameFinished}
