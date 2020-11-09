import {AxiosResponse} from "axios";

const uuidv4 = require("uuid").v4;
const MockAdapter = require('axios-mock-adapter');

function mockClient(axiosInstance, handlers) {
  const mockAdapter = new MockAdapter(axiosInstance);
  handlers.forEach(h => h(mockAdapter));
}

function randomKeyConfig() {
  return {accessKey: uuidv4(), secretAccessKey: uuidv4()};
}

function mockGetOk(matcher, response) {
  return (mock) => {
    mock.onGet(matcher).reply(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return [200, response];
    });
  }
}

function mockPostOk(matcher, response) {
  return (mock) => {
    mock.onPost(matcher).reply(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return [200, response];
    });
  }
}

function mockPost(matcher, handler: (config) => AxiosResponse) {
  return (mock) => {
    mock.onPost(matcher).reply(async (config) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return handler(config);
    });
  }
}

module.exports = {mockClient, mockGetOk, mockPostOk, mockPost, randomKeyConfig}
