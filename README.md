# client-js
Typescript/Javascript client for Serialized

## Import the library
```
var serialized = require('@serialized/serialized-client')
```

## Create a client instance
```
  const serializedInstance = serialized.create({
    accessKey: "<YOUR-ACCESS-KEY>",
    secretAccessKey: "<YOUR-SECRET-ACCESS-KEY>"
  });
```

## Create an aggregate
```
var todoListAggregate = {
    events:
               [ TodoCreatedEvent {
                   eventId: '6d725a9e-e515-47e4-b97e-ae72196bcf9f',
                   eventType: 'TodoCreatedEvent',
                   data: {na}} ]
}

await serializedInstance.aggregates.create();
```
