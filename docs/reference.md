# Client reference

This page documents all the methods and types defined in the JavaScript client library.

## Create a client instance

### `Serialized.create(clientConfig:SerializedConfig)`

Creates a client instance using the configuration options provided.

export interface SerializedConfig { accessKey: string; secretAccessKey: string; }

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
  'aggregateId': '02d59b37-1866-4d03-893f-cc9600737574',
  'aggregateType': 'purchases',
  'event': {
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
  aggregateId: '02d59b37-1866-4d03-893f-cc9600737574',
  aggregateType: 'purchases',
  event: {
    eventType: 'purchase-initiated'
  }
}
client.aggregates.storeEvents(request);
```

## Delete an aggregate

### `aggregates.deleteAggregate(request: DeleteAggregateRequest, options: DeleteAggregateOptions)`

Delete an aggregate by id. This deletes all events that are stored in the given aggregate. This method requires a
two-step call, where the first request returns a `deleteToken` that will be used in the `options` argument of an
additional subsequent call to confirm the deletion.

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
  aggregateId: '02d59b37-1866-4d03-893f-cc9600737574',
  aggregateType: 'purchases',
}
var {deleteToken} = await client.aggregates.deleteAggregate(request);
client.aggregates.deleteAggregate(request, {deleteToken: deleteToken});
```

## Delete an aggregate type

### `aggregates.deleteAggregateType(request: DeleteAggregateTypeRequest, options: DeleteAggregateTypeOptions)`

Delete all aggregates of a given type. This deletes all events that are stored in the given aggregate. This method
requires a two-step call, where the first request returns a `deleteToken` that will be used in the `options` argument of
an additional subsequent call to confirm the deletion.

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
  aggregateType: 'purchases',
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
  aggregateId: '02d59b37-1866-4d03-893f-cc9600737574',
  aggregateType: 'purchases',
}
const exists = await client.aggregates.checkExists(request); // Returns true or false
```

## Create or update a Projection definition

### `projections.createOrUpdateDefinition(request: CreateProjectionDefinitionRequest)`

Creates a Projection definition (updates if it already exists).

#### `CreateProjectionDefinitionRequest`

Description of the fields in the `CreateProjectionDefinitionRequest` argument:

| Field             | Type                                                   | Description
|----------------   |--------------------------------------------------------|--------------------------------------
| `projectionName`  | `string`                                               | The name of the projection
| `feedName`        | `string`                                               | The event feed that the projection will be created from
| `handlers`        | `CustomProjectionHandler[]` or `JsonPathHandler[]`     | Event handlers that will create the projection
| `aggregated`      | `boolean`                                              | `true` if the projection is an aggregated projection (default `false`)
| `idField`         | `string`                                               | The optional `ìdfield` for the projection.

#### `CustomProjectionHandler`

Description of the fields in the `CustomProjectionHandler` type:

| Field             | Type       | Description
|----------------   |------------|-------------------------------------------------
| `eventType`       | `string`   | The event type that the handles should act on.
| `functionUri`     | `string`   | The url of the custom handler method (external)

#### `JsonPathHandler`

Description of the fields in the `JsonPathHandler` type:

| Field             | Type                   | Description
|----------------   |------------------------|----------------------------------------------------------
| `eventType`       | `string`               | The event type that the handles should act on.
| `functions`       | `JsonPathFunction[]`   | The declaration of the JSONPath handler functions to use

#### `JsonPathFunction`

Description of the fields in the `JsonPathFunction` type:

| Field             | Type                   | Description
|----------------   |------------------------|----------------------------------------------------------
| `function`        | `string`               | The event type that the handles should act on.
| `targetSelector`  | `string`               | The target selector
| `eventSelector`   | `string`               | The event selector
| `targetFilter`    | `string`               | The target filter
| `eventFilter`     | `string`               | The event filter

## Delete a Projection definition

### `projections.deleteProjectionDefinition(request: DeleteProjectionDefinitionRequest)`

Deletes a projection definition. Note that all projection data for the projection definition will also be deleted.

#### `DeleteProjectionDefinitionRequest`

Description of the fields in the `DeleteProjectionDefinitionRequest` argument:

| Field             | Type                   | Description
|----------------   |------------------------|--------------------------------------------
| `projectionName`  | `string`               | Name of the projection definition to delete

## Get a Projection definition

### `projections.getProjectionDefinition(request: GetProjectionDefinitionRequest)`

Get the saved definition for a projection.

#### `GetProjectionDefinitionRequest`

Description of the fields in the `GetProjectionDefinitionRequest` argument:

| Field             | Type                   | Description
|----------------   |------------------------|-----------------------------------
| `projectionName`  | `string`               | Name of the projection definition

## Get a single Projection

### `projections.getSingleProjection(request: GetSingleProjectionRequest)`

Get the data for a **single** projection

#### `GetSingleProjectionRequest`

Description of the fields in the `GetSingleProjectionRequest` argument:

| Field             | Type                   | Description
|----------------   |------------------------|-----------------------------------
| `projectionName`  | `string`               | Name of the projection definition
| `projectionId`    | `string`               | Id of the projection to retrieve
| `awaitCreation`   | `number`               | Number of milliseconds to block for creation of the projection (optional)

## List all single Projections

### `projections.listSingleProjections(request: ListSingleProjectionRequest, options?: ListSingleProjectionOptions)`

Returns a listing of single Projections matching the request.

#### `ListSingleProjectionRequest`

Description of the fields in the `ListSingleProjectionRequest` argument:

| Field             | Type                   | Description
|----------------   |------------------------|-----------------------------------
| `projectionName`  | `string`               | Name of the projection type

#### `ListSingleProjectionOptions`

Description of the fields in the `ListSingleProjectionOptions` argument:

| Field             | Type                   | Description
|----------------   |------------------------|-----------------------------------
| `reference`  | `string`                    | Reference string to filter on. See 'setref' for details.
| `sort`  | `string`                         | Field to sort the returned projections on. Supported fields are projectionId, reference, createdAt, updatedAt with an optional prefix (+/-) to indicate ascending/descending sort order (optional).
| `skip`  | `skip`                           | Number of items to skip (optional)
| `limit`  | `number`                        | Max number of items to return (optional)

## Recreate all single Projections

### `projections.recreateSingleProjections(request: RecreateSingleProjectionsRequest)`

Recreates all single projections by requesting a replay of the event feed from which the projections were created.

#### `RecreateSingleProjectionsRequest`

Description of the fields in the `RecreateSingleProjectionsRequest` argument:

| Field             | Type                   | Description
|----------------   |------------------------|-----------------------------------
| `projectionName`  | `string`               | Name of the projection type to recreate

## Get aggregated Projection

### `projections.getAggregatedProjection(request: GetAggregatedProjectionRequest)`

Get data for an aggregated Projection.

#### `GetAggregatedProjectionRequest`

Description of the fields in the `GetAggregatedProjectionRequest` argument:

| Field             | Type                   | Description
|----------------   |------------------------|-----------------------------------
| `projectionName`  | `string`               | Name of the projection to get

## Recreated aggregated Projection

### `projections.recreateAggregatedProjection(request: RecreateAggregatedProjectionsRequest)`

Recreates an aggregated projection by requesting a replay of the event feed from which the projection was created.

#### `RecreateAggregatedProjectionsRequest`

Description of the fields in the `RecreateAggregatedProjectionsRequest` argument:

| Field             | Type                   | Description
|----------------   |------------------------|-----------------------------------
| `projectionName`  | `string`               | Name of the projection to recreate

## Create Reaction definition

### `reactions.createOrUpdateReactionDefinition(request: CreateReactionDefinitionRequest)`

Creates a Reaction definition. If a Reaction with the given name already exists it will be overwritten.

#### `CreateReactionDefinitionRequest`

Description of the fields in the `CreateReactionDefinitionRequest` argument:

| Field                   | Type                   | Description |
|-------------------------|------------------------|--------------------------------------------------
| `reactionName`          | `string`               | Name of the reaction to recreate
| `reactOnEventType`      | `string`               | The event type that the reaction should react to
| `action`                | `Action`               | The action to execute
| `cancelOnEventTypes`    | `string`               | List of events which cancels a scheduled Reaction (optional)
| `triggerTimeField`      | `string`               | Field that contains the timestamp when the Reaction should be triggered (optional)
| `offset`                | `string`               | Time offset for the `triggerTimeField` value. (optional)

#### `Action`

Description of the `Action` type:

The `Action` type can be any of the supported action types described below:

#### `HTTP_POST`

Sends a request to a given URL endpoint when the reaction is triggered.

| Field             | Type                   | Description
|----------------   |------------------------|---------------------------------------
| `actionType`      | `string`               | Should equal the value `HTTP_POST`
| `targetUri`       | `string`               | Target URL to call with the event data

#### `IFTTT_POST`

Sends a request to invoke an [IFTTT](https://ifttt.com/) action

| Field             | Type                   | Description
|----------------   |------------------------|---------------------------------------------
| `actionType`      | `string`               | Should equal the value `IFTTT_POST`
| `targetUri`       | `string`               | Target IFTTT URL to call with the event data
| `valueMap`        | `object`               | Object map containing value keys such as `value1`, `value2` etc with additional data for IFTTTT

#### `AUTOMATE_POST`

Sends a request to invoke an [Automate](https://automate.io) action

| Field             | Type                   | Description
|----------------   |------------------------|---------------------------------------------
| `actionType`      | `string`               | Should equal the value `AUTOMATE_POST`
| `targetUri`       | `string`               | Target Automate URL to call with the event data
| `valueMap`        | `object`               | Object map containing value keys such as `value1`, `value2` etc with additional data for Automate

#### `ZAPIER_POST`

Sends a request to invoke an [Zapier](https://zapier.com/) action

| Field             | Type                   | Description
|----------------   |------------------------|---------------------------------------------
| `actionType`      | `string`               | Should equal the value `ZAPIER_POST`
| `targetUri`       | `string`               | Target Zapier URL to call with the event data
| `valueMap`        | `object`               | Object map containing value keys such as `value1`, `value2` etc with additional data for Zapier

#### `SLACK_ACTION`

Sends a request to invoke an [Slack](https://slack.com/) action

| Field             | Type                   | Description
|----------------   |------------------------|---------------------------------------------
| `actionType`      | `string`               | Should equal the value `SLACK_POST`
| `targetUri`       | `string`               | Target Slack URL to call with the event data
| `body`            | `object`               | Object map containing additional data to send to Slack

## List Reaction definitions

### `reactions.listReactionDefinitions(): Promise<LoadReactionDefinitionsResponse>`

Lists all Reaction definitions.

## Get a Reaction definition

### `reactions.getReactionDefinition(request: GetReactionDefinitionRequest): Promise<LoadReactionDefinitionResponse>`

Loads a Reaction definition.

#### `GetReactionDefinitionRequest`

Description of the fields in the `GetReactionDefinitionRequest` argument:

| Field                   | Type                   | Description
|-------------------------|------------------------|--------------------------------------------------
| `reactionName`          | `string`               | Name of the reaction to load

## List Reactions

### `reactions.listReactions(options?: ListReactionsOptions): Promise<ListReactionsResponse>`

Lists all Reactions

#### `ListReactionsOptions`

Description of the fields in the (optional) `options` argument:

| Field    | Type     | Description
|----------|----------|----------
| `status` | `string` | Status to filter on, default is 'ALL'. Valid values: SCHEDULED, READY, ONGOING, COMPLETED, CANCELED, FAILED.
| `skip`   | `number` | Number of entries to skip. (optional)
| `limit`  | `number` | Maximum number of entries returned. (optional)


## Delete Reaction

### `reactions.deleteReaction(request: DeleteReactionRequest)`

Delete Reaction

#### `DeleteReactionRequest`

Description of the fields in the `DeleteReactionRequest` argument:

| Field                   | Type              | Description
|-------------------------|-------------------|------------------------------
| `reactionId`            | `string`          | Id of the reaction to delete

## Execute Reaction

### `reactions.executeReaction(request: ExecuteReactionRequest)`

Execute Reaction.

#### `ExecuteReactionRequest`

Description of the fields in the `ExecuteReactionRequest` argument:

| Field                   | Type              | Description
|-------------------------|-------------------|------------------------------
| `reactionId`            | `string`          | Id of the reaction to execute

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
var request = {name: 'purchases'}
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

