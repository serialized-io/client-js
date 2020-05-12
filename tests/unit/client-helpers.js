var MockAdapter = require('axios-mock-adapter');

function mockClient(axiosInstance, handlers) {
  const mockAdapter = new MockAdapter(axiosInstance);
  handlers.forEach(h => h(mockAdapter));
}

function mockGetOk(matcher, response) {
  return (mock) => {
    mock.onGet(matcher).reply(async (config) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return [200, response];
    });
  }
}

function mockPostOk(matcher, response) {
  return (mock) => {
    mock.onPost(matcher).reply(async (config) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return [200, response];
    });
  }
}

module.exports = {mockClient, mockGetOk, mockPostOk}
