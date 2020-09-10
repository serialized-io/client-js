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

Then, import the library and initialize the client instance:

```js
var {Serialized} = require("@serialized/serialized-client")
var uuidv4 = require("uuid").v4
var serialized = Serialized.create({
    accessKey: "<YOUR_ACCESS_KEY>", 
    secretAccessKey: "<YOUR_SECRET_ACCESS_KEY>"
});
```

Test the client by storing an event:
```js
var aggregateClient = serialized.aggregates;
var request = {
      aggregateType: 'user-registration',
      aggregateId: uuidv4(),
      event: {
        eventType: 'UserRegistrationStarted',
        data: {
          email: 'johndoe@example.com'
        }
      }
    }
await aggregateClient.storeEvent(request)
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
