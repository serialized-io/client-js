# Methods and Classes

This page documents all the methods and classes defined in the JavaScript client library.

## Create a client instance

### `Serialized.create(clientConfig:SerializedConfig)`

Creates a client instance using the configuration options provided.

export interface SerializedConfig {
  accessKey: string;
  secretAccessKey: string;
}

Arguments:

| Name           | Type               | Description
|--------------- |--------------------|----------
| `clientConfig` | `SerializedConfig`


## Store an event

### `aggregates.storeEvent(request: StoreEventRequest, options: StoreEventOptions)`

Stores a single event in the Serialized event store.

#### `StoreEventRequest`

Description of the fields in the `StoreEventRequest` argument:

| Field             | Type                                | Description
|----------------   |-------------------------------------|----------
| `aggregateId`     | `string`                            | The id of the aggregate that the event should be stored to.
| `aggregateType`   | `string`                            | The type of the aggregate that the event should be stored to.
| `event`           | [`DomainEvent`](#domain-event)      | The actual domain event object that will be stored.

**Example:**
```js
var request = {
  'aggregateId' : '02d59b37-1866-4d03-893f-cc9600737574',
  'aggregateType' : 'purchases',
  'event' : {
    'eventType': 'purchase-initiated'
  }
}
client.aggregates.storeEvent(request);
```

## Store an event batch

### `aggregates.storeEvents(request: StoreEventsRequest, options: StoreEventsOptions)`

Stores a batch of events atomically

#### `StoreEventsRequest`

Description of the fields in the `StoreEventsRequest` argument:

| Field             | Type                                | Description
|----------------   |-------------------------------------|----------
| `aggregateId`     | `string`                            | The id of the aggregate that the event should be stored to.
| `aggregateType`   | `string`                            | The type of the aggregate that the event should be stored to.
| `event`           | [`DomainEvent`](#domain-event)      | The array of domain event object that will be stored.

**Example:**
```js
var request = {
  aggregateId : '02d59b37-1866-4d03-893f-cc9600737574',
  aggregateType : 'purchases',
  event : {
    eventType: 'purchase-initiated'
  }
}
client.aggregates.storeEvents(request);
```

## Delete an aggregate

### `aggregates.deleteAggregate(request: DeleteAggregateRequest, options: DeleteAggregateOptions)`

Delete an aggregate by id. This deletes all events that are stored in the given aggregate. This method requires a two-step call, where the first request returns a `deleteToken` that will be used in the `options` argument of an additional subsequent call to confirm the deletion. 

#### `DeleteAggregateRequest`

Description of the fields in the `DeleteAggregateRequest` argument:

| Field             | Type         | Description
|----------------   |--------------|----------
| `aggregateType`   | `string`     | The type of the aggregate that will be deleted.
| `aggregateId`     | `string`     | The id of the aggregate that will be deleted.

#### DeleteAggregateOptions
Description of the fields in the `DeleteAggregateOptions` argument:

| Field             | Type         | Description
|----------------   |--------------|----------
| `deleteToken`     | `string`     | Token that is used to confirm the deletion of the previous request.


**Example:**
```js
var request = {
  aggregateId : '02d59b37-1866-4d03-893f-cc9600737574',
  aggregateType : 'purchases',
}
var {deleteToken} = await client.aggregates.deleteAggregate(request);
client.aggregates.deleteAggregate(request, {deleteToken: deleteToken});
```

## Delete an aggregate type

### `aggregates.deleteAggregateType(request: DeleteAggregateTypeRequest, options: DeleteAggregateTypeOptions)`

Delete all aggregates of a given type. This deletes all events that are stored in the given aggregate. This method requires a two-step call, where the first request returns a `deleteToken` that will be used in the `options` argument of an additional subsequent call to confirm the deletion. 

#### `DeleteAggregateTypeRequest`

Description of the fields in the `DeleteAggregateTypeRequest` argument:

| Field             | Type         | Description
|----------------   |--------------|----------
| `aggregateType`   | `string`     | The type of the aggregates that will be deleted.

#### DeleteAggregateTypeOptions
Description of the fields in the `DeleteAggregateTypeOptions` argument:

| Field             | Type         | Description
|----------------   |--------------|----------
| `deleteToken`     | `string`     | Token that is used to confirm the deletion of the previous request.


**Example:**
```js
var request = {
  aggregateType : 'purchases',
}
var {deleteToken} = await client.aggregates.deleteAggregate(request);
client.aggregates.deleteAggregateType(request, {deleteToken: deleteToken});
```

## Check if an aggregate exists

### `aggregates.checkExists(request: CheckAggregateExistsRequest)`

Check if an aggregate exists without loading or returning the aggregate data to the client.

#### `CheckAggregateExistsRequest`

Description of the fields in the `CheckAggregateExistsRequest` argument:

| Field             | Type         | Description
|----------------   |--------------|----------
| `aggregateType`   | `string`     | The type of the aggregate.
| `aggregateId`     | `string`     | The id of the aggregate.

**Example:**
```js
var request = {
  aggregateId : '02d59b37-1866-4d03-893f-cc9600737574',
  aggregateType : 'purchases',
}
await client.aggregates.checkExists(request); // Throws an error if the aggregate does not exist
```


## List feeds

### `feeds.loadOverview()`

Loads an overview of all event feeds.

**Example:**
```js
await client.feeds.loadOverview();
```


## Load a feed of events

### `feeds.loadFeed(request: LoadFeedRequest, options?: LoadFeedOptions)`

Loads a specific feed of events (for a given aggregate type). 


#### `LoadFeedRequest`

Description of the fields in the `LoadFeedRequest` argument:

| Field             | Type         | Description
|----------------   |--------------|----------
| `name`            | `string`     | The name of the feed to load

#### `LoadFeedOptions`

Description of the fields in the (optional) `options` argument:

| Field             | Type         | Description
|----------------   |--------------|----------
| `since`           | `number`     | Sequence number to start feeding from
| `limit`           | `number`     | Maximum number of events returned. (optional)
| `from`            | `string`     | Date-time string to start from, eg. 2017-07-21T17:32:28. (optional)
| `to`              | `string`     | Date-time string to stop at, eg. 2017-07-21T17:32:28. (optional)

**Example:**
```js
var request = { name: 'purchases' }
await client.feeds.loadFeed(request);
```


# Common types

## Domain event

### `DomainEvent`


| Field             | Type               | Description
|----------------   |--------------------|----------
| `eventType`       | `string`           | The type of the domain event
| `eventId`         | `string`           | The id of the domain event (optional)
| `data`            | `object`           | The custom event data (optional)
| `encryptedData`   | `string`           | The encrypted part of the event data (optional)

