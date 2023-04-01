import {v4 as uuidv4} from 'uuid';
import {DomainEvent, SerializedInstance, StateBuilder} from "../../../lib";
import {NoRetryStrategy, RetryStrategy} from "../../../lib/RetryStrategy";

enum GameStatus {
  UNDEFINED = 'UNDEFINED',
  CREATED = 'CREATED',
  STARTED = 'STARTED',
  CANCELED = 'CANCELED',
  FINISHED = 'FINISHED'
}

type GameState = {
  readonly gameId?: string
  readonly status: GameStatus
}

type GameCreated = DomainEvent<'GameCreated', { gameId: string, creationTime: number }>
type GameStarted = DomainEvent<'GameStarted', { gameId: string, startTime: number }>
type GameCanceled = DomainEvent<'GameCanceled', { gameId: string, cancelTime: number }>
type GameFinished = DomainEvent<'GameFinished', { gameId: string, endTime: number }>

type GameEvent = GameCreated | GameStarted | GameCanceled | GameFinished;

class InvalidGameStatusException extends Error {
  constructor(expected: GameStatus, actual: GameStatus) {
    super(`Game status is not valid: [expected: ${expected}, actual: ${actual}]`);
  }
}

const stateBuilder: StateBuilder<GameState, GameEvent> = {
  initialState: () => {
    return {gameId: '', status: GameStatus.UNDEFINED}
  },
  applyGameCreated: (state, event) => {
    return {...state, gameId: event.data.gameId, status: GameStatus.CREATED}
  },
  applyGameStarted: (state, event) => {
    return {...state, status: GameStatus.STARTED}
  },
  applyGameCanceled: (state, event) => {
    return {...state, gameId: event.data.gameId, status: GameStatus.CANCELED}
  },
  applyGameFinished: (state, event) => {
    return {...state, gameId: event.data.gameId, status: GameStatus.FINISHED}
  },
}

/**
 * Illustrates how to use default handler and implement event handlers for a subset of the events.
 */
const safeStateBuilder: StateBuilder<GameState, GameEvent> = {
  initialState: () => {
    return {gameId: '', status: GameStatus.UNDEFINED}
  },
  applyGameCreated: (state, event) => {
    return {...state, gameId: event.data.gameId, status: GameStatus.CREATED}
  },
  defaultHandler: (state, event) => {
    console.log(`Unsupported event: ${event.eventType}. Skipping it.`);
    return state
  }
}

class Game {
  constructor(private readonly state: GameState) {
  }

  create(gameId: string, creationTime: number): GameCreated[] {
    const currentStatus = this.state.status;
    if (currentStatus == GameStatus.UNDEFINED) {
      return [{
        eventType: 'GameCreated',
        eventId: uuidv4(),
        data: {
          gameId,
          creationTime
        }
      }];
    } else if (currentStatus == GameStatus.CREATED) {
      return [];
    } else {
      throw new InvalidGameStatusException(GameStatus.UNDEFINED, currentStatus);
    }
  }

  start(startTime: number, encryptedData?: string): GameStarted[] {
    const currentStatus = this.state.status;
    if (this.state.status == GameStatus.STARTED) {
      return [];
    } else if (this.state.status == GameStatus.CREATED) {
      return [{
        eventType: 'GameStarted',
        eventId: uuidv4(),
        data: {
          gameId: this.state.gameId,
          startTime
        },
        encryptedData
      }];
    }
    throw new InvalidGameStatusException(GameStatus.CREATED, currentStatus);
  }

  cancel(cancelTime: number): GameCanceled[] {
    const currentStatus = this.state.status;
    if (this.state.status == GameStatus.CANCELED) {
      return [];
    } else if (this.state.status == GameStatus.STARTED) {
      return [{
        eventType: 'GameCanceled',
        eventId: uuidv4(),
        data: {
          gameId: this.state.gameId,
          cancelTime
        }
      }];
    }
    throw new InvalidGameStatusException(GameStatus.STARTED, currentStatus);
  }

}

const createGameClient = (serialized: SerializedInstance, retryStrategy?: RetryStrategy) => {
  return serialized.aggregateClient({
    aggregateType: 'game',
    retryStrategy: retryStrategy || new NoRetryStrategy()
  }, stateBuilder, (state: GameState) => new Game(state));
}

const createSafeGameClient = (serialized: SerializedInstance, retryStrategy?: RetryStrategy) => {
  return serialized.aggregateClient({
    aggregateType: 'game',
    retryStrategy: retryStrategy || new NoRetryStrategy()
  }, safeStateBuilder, (state: GameState) => new Game(state));
}

export {
  createGameClient,
  createSafeGameClient,
  stateBuilder,
  Game,
  GameState,
  GameStatus,
  GameStarted,
  GameCanceled,
  GameCreated,
  GameFinished,
  GameEvent
}
