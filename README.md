# Serialized Javascript & Typescript client

Typescript/Javascript client for Serialized.

## Install the latest version
```
npm install @serialized/serialized-client
```


## Import the library
```
var {Serialized} = require("@serialized/serialized-client")
```

## Create a client instance
```
var serialized = Serialized.create({
    accessKey: "<YOUR_ACCESS_KEY>", 
    secretAccessKey: "<YOUR_SECRET_ACCESS_KEY>"
});
```

## Store events for an aggregate
```
var payload = {
    events: [ {
      eventType: 'TodoCreated',
      data: {
        title: 'Buy milk'
      }
    }]
  };

await serialized.aggregates.storeEvents('todo-lists', 'e624f476-5636-4ffe-940a-a93408880996', payload)
```

## Resources

* [Contributing Guide](https://github.com/serialized-io/client-js/blob/master/CONTRIBUTING.md)
* [Code of Conduct](https://github.com/serialized-io/client-js/blob/master/CODE_OF_CONDUCT.md)
