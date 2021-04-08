import {
  CreateProjectionDefinitionRequest,
  GetSingleProjectionResponse,
  ListSingleProjectionOptions,
  ListSingleProjectionsResponse,
  ProjectionsClient,
  Serialized
} from "../../lib";
import {v4 as uuidv4} from 'uuid';

const {mockClient, mockGetOk, mockPutOk, randomKeyConfig} = require("./client-helpers");

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
          mockGetOk(RegExp(`^${(ProjectionsClient.singleProjectionUrl('user-projection', projectionId))}$`), projectionResponse),
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
          mockGetOk(RegExp(`^${(ProjectionsClient.singleProjectionsUrl('user-projection'))}$`), zeroProjectionsResponse),
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
          mockGetOk(RegExp(`^${(ProjectionsClient.projectionDefinitionUrl('todo-list-summaries'))}$`), projectionDefinition),
        ]);

    const response = await projectionsClient.getProjectionDefinition({projectionName: 'todo-list-summaries'});
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
          mockPutOk(RegExp(`^${(ProjectionsClient.projectionDefinitionUrl('user-projection'))}$`), projectionDefinition),
        ]);

    await projectionsClient.createOrUpdateDefinition(projectionDefinition);
  })

  it('Can provide signing secret', async () => {

    const projectionsClient = Serialized.create(randomKeyConfig()).projectionsClient()
    const signingSecret = 'some-secret-value';
    const projectionDefinition: CreateProjectionDefinitionRequest = {
      feedName: 'user-registration',
      projectionName: 'user-projection',
      signingSecret,
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
            const expectedUrl = ProjectionsClient.projectionDefinitionUrl('user-projection')
            const matcher = RegExp(`^${expectedUrl}$`);
            mock.onPut(matcher).reply(async (config) => {
              await new Promise((resolve) => setTimeout(resolve, 300));
              expect(JSON.parse(config.data).signingSecret).toStrictEqual(signingSecret)
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
