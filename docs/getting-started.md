# Installing the library

The client library is published as a NPM package and to install it to your project use the following command:

```bash
npm install @serialized/serialized-client
```

# Configuring the client

To use the library you create a client instance using the API keys for the Serialized project you want to use. The API keys are available from the [Serialized console](https://app.serialized.io). To access the project you initialize the client with your `accessKey` and `secretAccessKey`:

```js
var {Serialized} = require("@serialized/serialized-client")
var client = Serialized.create({
    accessKey: "<YOUR_ACCESS_KEY>", 
    secretAccessKey: "<YOUR_SECRET_ACCESS_KEY>"
});
```

When you have created the instance you can test that it's working by for example calling the feeds overview endpoint:

```js
var response = await client.feeds.loadOverview();
console.log(response)
```

This should return something like this:

```json
{
  "feeds": []
}
```
