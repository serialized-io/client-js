import {AxiosInstance, AxiosRequestConfig, AxiosResponse} from "axios";
import {SerializedConfig} from "../../lib";
import MockAdapter from "axios-mock-adapter";
import {v4 as uuidv4} from "uuid";

type MockHandler = (MockAdapter) => AxiosResponse;

function mockClient(axiosInstance: AxiosInstance, handlers: MockHandler[]) {
  const mockAdapter = new MockAdapter(axiosInstance);
  handlers.forEach(h => h(mockAdapter));
}

function randomKeyConfig() {
  return {accessKey: uuidv4(), secretAccessKey: uuidv4()};
}

function mockGetOk(matcher, response) {
  return (mock: MockAdapter) => {
    mock.onGet(matcher).reply(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return [200, response];
    });
  }
}

function mockPostOk(matcher, response) {
  return (mock: MockAdapter) => {
    mock.onPost(matcher).reply(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return [200, response];
    });
  }
}

function mockPutOk(matcher, response) {
  return (mock: MockAdapter) => {
    mock.onPut(matcher).reply(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return [200, response];
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
  randomKeyConfig,
  assertMatchesSingleTenantRequestHeaders,
  assertMatchesMultiTenantRequestHeaders
}
