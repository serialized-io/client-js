# Serialized Typescript client

The official Typescript client for [Serialized](https://serialized.io).

## ✨ Features

- Built with Typescript
- Client for Event Sourcing & CQRS APIs provided by [Serialized](https://serialized.io)
- Promise-based API that supports async/await
- Provides an easy way to implement DDD Aggregates using Event Sourcing.

## 💡 Getting Started

Register for a free account at https://serialized.io to get your access keys to the API (if you haven't already).

Install the Serialized TS/JS client via the [npm](https://www.npmjs.com/get-npm) package manager:

```bash
npm install @serialized/serialized-client
```

Import the library and initialize the client instance:

```typescript
import {Serialized} from "@serialized/serialized-client"

const serialized = Serialized.create({
  accessKey: "<YOUR_ACCESS_KEY>",
  secretAccessKey: "<YOUR_SECRET_ACCESS_KEY>"
});
```

## Create our domain

### State

The state type holds the assembled state from the events during the load of the aggregate.

```typescript
// The different statuses our game can be in
enum GameStatus {
  UNDEFINED = 'UNDEFINED',
  CREATED = 'CREATED',
  STARTED = 'STARTED',
  CANCELED = 'CANCELED',
  FINISHED = 'FINISHED'
}

type GameState = {
  readonly gameId?: string
  readonly status?: GameStatus
}

```

### Events

Define your domain events as types

```typescript
type GameCreated = DomainEvent<'GameCreated', { gameId: string, creationTime: number }>
type GameStarted = DomainEvent<'GameStarted', { gameId: string, startTime: number }>
type GameCanceled = DomainEvent<'GameCanceled', { gameId: string, cancelTime: number }>
type GameFinished = DomainEvent<'GameFinished', { gameId: string, endTime: number }>
type GameEvent = GameCreated | GameStarted | GameCanceled | GameFinished;
```

Next, we create the `StateBuilder` implementation, which can handle loading events one-by-one to create the current
state. Each method should have `apply` as a prefix and the event type as the suffix and return the new state.

```typescript
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
    return {...state, status: GameStatus.CANCELED}
  },
  applyGameFinished: (state, event) => {
    return {...state, status: GameStatus.FINISHED}
  }
}
```

## Aggregate

The aggregate contains the domain logic and each method should return `0..n` events that should be stored for a
successful operation. The aggregate takes the state as a constructor argument and should be immutable.

Any unsuccessful operation should throw an error.

```typescript
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

  start(startTime: number): GameStarted[] {
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
        }
      }];
    }
    throw new InvalidGameStatusException(GameStatus.CREATED, currentStatus);
  }

...

}

```

Test the client by creating a `Game`:

```typescript
const gameClient = serialized.aggregateClient({aggregateType: 'game'}, stateBuilder, (state: GameState) => new Game(state));
await gameClient.create(gameId, (game) => (game.create(gameId, Date.now())));
```

To perform an `update` operation, which means loading all events, performing business logic and then appending more
events

```typescript
await gameClient.update({aggregateId: gameId}, (game: Game) => game.start(startTime))
```

## 📄 More resources

* [Contributing Guide](https://github.com/serialized-io/client-js/blob/main/CONTRIBUTING.md)
* [Code of Conduct](https://github.com/serialized-io/client-js/blob/main/CODE_OF_CONDUCT.md)
* [License](LICENSE)

## ❓ Troubleshooting

Encountering an issue? Don't feel afraid to add an issue here on Github or to reach out
via [Serialized](https://serialized.io).
