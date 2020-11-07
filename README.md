# Serialized Javascript & Typescript client

The official Javascript/Typescript client for [Serialized](https://serialized.io).

## ✨ Features

- Client for Event Sourcing & CQRS APIs provided by [Serialized](https://serialized.io) 
- Works both for Typescript and Javascript on Node version >= 10.
- Promise-based API that supports async/await
- Built with Typescript
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
  FINISHED = 'FINISHED'
}

type GameState = {
  readonly gameId?: string;
  readonly status?: GameStatus;
}
```

### Events
Define your domain events as immutable Typescript classes.

```typescript
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
```

Next, we create the state builder, which can handle loading events one-by-one to create the current state. 

The state builder has methods decorated with `@EventHandler` to mark its event handling methods: 
```typescript
class GameStateBuilder {

  get initialState(): GameState {
    return {
      status: GameStatus.UNDEFINED
    }
  }

  @EventHandler(GameCreated)
  handleGameCreated(event: GameCreated, state: GameState): GameState {
    return {gameId: state.gameId, status: GameStatus.CREATED};
  }

  @EventHandler(GameStarted)
  handleGameStarted(event: GameStarted, state: GameState): GameState { 
    return {...state, status: GameStatus.STARTED};
  }

}
```

## Aggregate 

The aggregate contains the domain logic and each method should return `0..n` events that should be stored for a successful operation.

Any unsuccessful operation should throw an error. 

```typescript
@Aggregate('game', GameStateBuilder)
class Game {

  constructor(private readonly state: GameState) {
  }

  create(gameId: string, creationTime: number) {
    return [new GameCreated(gameId, creationTime)];
  }

  start(gameId: string, startTime: number) {
    if(this.state.status !== GameStatus.CREATED) {
      throw new Error('Must create Game before you can start it');
    }
    return [new GameStarted(gameId, startTime)];
  }

}
```

Test the client by creating a `Game`:
```typescript
const gameClient = serialized.aggregateClient(Game);
const gameId = uuidv4();
await gameClient.create(gameId, (game) => ({
      events: game.create(gameId, Date.now())
    }));
```

To perform an `update` operation, which means loading all events, performing business logic and then appending more events
```typescript
await gameClient.update(gameId, (game: Game) =>
        ({events: game.start(gameId, startTime)}));
```

## 📄 Client reference

* [Getting started](https://github.com/serialized-io/client-js/blob/master/docs/getting-started.md)
* [Reference](https://github.com/serialized-io/client-js/blob/master/docs/reference.md)

## 📄 More resources

* [Contributing Guide](https://github.com/serialized-io/client-js/blob/master/CONTRIBUTING.md)
* [Code of Conduct](https://github.com/serialized-io/client-js/blob/master/CODE_OF_CONDUCT.md)
* [License](LICENSE)

## ❓ Troubleshooting

Encountering an issue? Don't feel afraid to add an issue here on Github or to reach out via [Serialized](https://serialized.io).
