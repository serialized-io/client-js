import {AxiosRequestConfig, AxiosResponse} from "axios";
import {SerializedConfig} from "../../lib";

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

function mockPutOk(matcher, response) {
  return (mock) => {
    mock.onPut(matcher).reply(async () => {
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

function assertMatchesSingleTenantRequestHeaders(request: AxiosRequestConfig, config: SerializedConfig) {
  expect(Object.keys(request.headers)).not.toContain('Serialized-Tenant-Id')
  expect(request.headers['Serialized-Access-Key']).toStrictEqual(config.accessKey)
  expect(request.headers['Serialized-Secret-Access-Key']).toStrictEqual(config.secretAccessKey)
}

function assertMatchesMultiTenantRequestHeaders(request: AxiosRequestConfig, config: SerializedConfig, tenantId: string) {
  expect(request.headers['Serialized-Access-Key']).toStrictEqual(config.accessKey)
  expect(request.headers['Serialized-Secret-Access-Key']).toStrictEqual(config.secretAccessKey)
  expect(request.headers['Serialized-Tenant-Id']).toStrictEqual(tenantId)
}

module.exports = {
  mockClient,
  mockGetOk,
  mockPostOk,
  mockPutOk,
  mockPost,
  randomKeyConfig,
  assertMatchesSingleTenantRequestHeaders,
  assertMatchesMultiTenantRequestHeaders
}
