import {
  GetSingleProjectionResponse,
  ListSingleProjectionOptions,
  ListSingleProjectionsResponse,
  ProjectionsClient,
  Serialized
} from "../../lib";
import {v4 as uuidv4} from 'uuid';
import {AxiosRequestConfig} from "axios";

const {mockClient, randomKeyConfig} = require("./client-helpers");

describe('Projections client', () => {

  it('Can load single projection by id', async () => {

    const projectionsClient = Serialized.create(randomKeyConfig()).projectionsClient()
    const projectionId = uuidv4();

    const projectionResponse: GetSingleProjectionResponse = {
      projectionId: projectionId,
      createdAt: 0,
      updatedAt: 0,
      data: {
        userName: 'johndoe'
      }
    };

    mockClient(
        projectionsClient.axiosClient,
        [
          (mock) => {
            const expectedUrl = ProjectionsClient.singleProjectionUrl('user-projection', projectionId);
            const matcher = RegExp(`^${expectedUrl}$`);
            mock.onGet(matcher).reply(async (config: AxiosRequestConfig) => {
              await new Promise((resolve) => setTimeout(resolve, 300));
              return [200, projectionResponse];
            });
          }
        ]);

    const projection = await projectionsClient.getSingleProjection({
      projectionId: projectionId,
      projectionName: 'user-projection'
    });

    expect(projection).toStrictEqual(projectionResponse)

  });

  it('Can list single projections', async () => {
    const projectionsClient = Serialized.create(randomKeyConfig()).projectionsClient()
    const requestOptions: ListSingleProjectionOptions = {
      skip: 0,
      limit: 10,
      sort: 'userName',
    };

    const zeroProjectionsResponse: ListSingleProjectionsResponse = {
      hasMore: false,
      projections: [],
      totalCount: 0
    }
    mockClient(
        projectionsClient.axiosClient,
        [
          (mock) => {
            const expectedUrl = ProjectionsClient.singleProjectionsUrl('user-projection');
            const matcher = RegExp(`^${expectedUrl}$`);
            mock.onGet(matcher).reply(async (config: AxiosRequestConfig) => {

              // Verify that the expected query params in the request are sent to the API
              expect(config.params).toEqual(requestOptions);

              await new Promise((resolve) => setTimeout(resolve, 300));
              return [200, zeroProjectionsResponse];
            });
          }
        ]);

    const projections = await projectionsClient.listSingleProjections({
      projectionName: 'user-projection'
    }, requestOptions);

    expect(projections).toStrictEqual(zeroProjectionsResponse)
  });

  it('Can load a projection definition', async () => {

    const projectionsClient = Serialized.create(randomKeyConfig()).projectionsClient()
    const projectionDefinition = {
      feedName: 'todo-lists',
      projectionName: 'todo-list-summaries',
      handlers: [
        {
          eventType: 'TodoAddedEvent',
          functions: [
            {
              function: 'merge',
            }
          ],
        }
      ]
    };
    mockClient(
        projectionsClient.axiosClient,
        [
          (mock) => {
            const expectedUrl = ProjectionsClient.projectionDefinitionUrl('user-projection');
            const matcher = RegExp(`^${expectedUrl}$`);
            mock.onGet(matcher).reply(async () => {
              await new Promise((resolve) => setTimeout(resolve, 300));
              return [200, projectionDefinition];
            });
          }
        ]);

    const response = await projectionsClient.getProjectionDefinition({projectionName: 'user-projection'});
    expect(response).toStrictEqual(projectionDefinition)
  })

  it('Can create a projection definition', async () => {

    const projectionsClient = Serialized.create(randomKeyConfig()).projectionsClient()
    const projectionDefinition = {
      feedName: 'user-registration',
      projectionName: 'user-projection',
      handlers: [
        {
          eventType: 'UserRegisteredEvent',
          functions: [
            {
              function: 'merge',
            }
          ],
        }
      ]
    };
    mockClient(
        projectionsClient.axiosClient,
        [
          (mock) => {
            const expectedUrl = ProjectionsClient.projectionDefinitionUrl('user-projection');
            const matcher = RegExp(`^${expectedUrl}$`);
            mock.onPut(matcher).reply(async () => {
              await new Promise((resolve) => setTimeout(resolve, 300));
              return [200, projectionDefinition];
            });
          }
        ]);

    await projectionsClient.createOrUpdateDefinition(projectionDefinition);
  })

  it('Should hide credentials in case of error', async () => {

    const projectionsClient = Serialized.create(randomKeyConfig()).projectionsClient()
    mockClient(
        projectionsClient.axiosClient,
        [
          (mock) => {
            const expectedUrl = ProjectionsClient.projectionDefinitionUrl('user-projection');
            const matcher = RegExp(`^${expectedUrl}$`);
            mock.onGet(matcher).reply(async () => {
              await new Promise((resolve) => setTimeout(resolve, 300));
              return [500, {}];
            });
          }
        ]);

    try {
      await projectionsClient.getProjectionDefinition({projectionName: 'user-projection'});
      fail('Should return an error')
    } catch (e) {
      const response = e.response;
      expect(response.config.headers['Serialized-Access-Key']).toStrictEqual('******')
      expect(response.config.headers['Serialized-Secret-Access-Key']).toStrictEqual('******')
    }

  })

})
