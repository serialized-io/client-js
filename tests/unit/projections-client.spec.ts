import {
  CountSingleProjectionRequest,
  CreateProjectionDefinitionRequest,
  DeleteProjectionDefinitionRequest,
  DeleteProjectionsRequest,
  GetAggregatedProjectionResponse,
  GetSingleProjectionRequest,
  GetSingleProjectionResponse,
  ListSingleProjectionOptions,
  ListSingleProjectionsResponse,
  ProjectionsClient,
  ProjectionType,
  Serialized
} from "../../lib";
import {v4 as uuidv4} from 'uuid';

const {mockClient, mockGetOk, mockPutOk, randomKeyConfig} = require("./client-helpers");

describe('Projections client', () => {

  it('Can get single projection by id', async () => {

    const projectionsClient = Serialized.create(randomKeyConfig()).projectionsClient()
    const projectionName = 'user-registration';
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

            const expectedUrl = ProjectionsClient.singleProjectionUrl(projectionName, projectionId);
            const matcher = RegExp(`^${expectedUrl}$`);
            mock.onGet(matcher).reply(async (config) => {
              await new Promise((resolve) => setTimeout(resolve, 300));
              expect(Object.keys(config.headers)).not.toContain('Serialized-Tenant-Id')
              expect(Object.keys(config.headers)).toContain('Serialized-Access-Key')
              expect(Object.keys(config.headers)).toContain('Serialized-Secret-Access-Key')
              return [200, projectionResponse];
            });
          }
        ])

    const projection = await projectionsClient.getSingleProjection({projectionId, projectionName});
    expect(projection).toStrictEqual(projectionResponse)
  });

  it('Can load aggregated projection', async () => {

    const projectionsClient = Serialized.create(randomKeyConfig()).projectionsClient()

    const projectionResponse: GetAggregatedProjectionResponse = {
      projectionId: uuidv4(),
      createdAt: 0,
      updatedAt: 0,
      data: {
        users: 232
      }
    };

    mockClient(
        projectionsClient.axiosClient,
        [
          mockGetOk(RegExp(`^${(ProjectionsClient.aggregatedProjectionUrl('users-projection'))}$`), projectionResponse),
        ]);

    const projection = await projectionsClient.getAggregatedProjection({
      projectionName: 'users-projection'
    });

    expect(projection).toStrictEqual(projectionResponse)

  });

  it('Can list single projections', async () => {
    const projectionsClient = Serialized.create(randomKeyConfig()).projectionsClient()
    const requestOptions: ListSingleProjectionOptions = {
      skip: 15,
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
            const expectedUrl = ProjectionsClient.singleProjectionsUrl('user-projection')
            const matcher = RegExp(`^${expectedUrl}$`);
            mock.onGet(matcher).reply(async (config) => {
              await new Promise((resolve) => setTimeout(resolve, 300));
              const params: URLSearchParams = config.params;
              expect(params.get('limit')).toStrictEqual('10')
              expect(params.get('skip')).toStrictEqual('15')
              expect(params.get('sort')).toStrictEqual('userName')
              return [200, zeroProjectionsResponse];
            });
          }
        ])

    const projections = await projectionsClient.listSingleProjections({
      projectionName: 'user-projection'
    }, requestOptions);

    expect(projections).toStrictEqual(zeroProjectionsResponse)
  })

  it('Can list single projections without options', async () => {
    const projectionsClient = Serialized.create(randomKeyConfig()).projectionsClient()

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
    });

    expect(projections).toStrictEqual(zeroProjectionsResponse)
  });

  it('Can list single projections with specified ids', async () => {
    const projectionsClient = Serialized.create(randomKeyConfig()).projectionsClient()

    const projection1: GetSingleProjectionResponse = {
      projectionId: uuidv4(),
      createdAt: 0,
      updatedAt: 0,
      data: {
        userName: 'johndoe'
      }
    };

    const projection2: GetSingleProjectionResponse = {
      projectionId: uuidv4(),
      createdAt: 0,
      updatedAt: 0,
      data: {
        userName: 'lisadoe'
      }
    };

    const requestOptions: ListSingleProjectionOptions = {
      skip: 0,
      limit: 10,
      sort: 'userName',
      id: [projection1.projectionId, projection2.projectionId]
    };

    const response: ListSingleProjectionsResponse = {
      hasMore: false,
      projections: [projection1, projection2],
      totalCount: 2
    }
    mockClient(
        projectionsClient.axiosClient,
        [
          (mock) => {
            const expectedUrl = ProjectionsClient.singleProjectionsUrl('user-projection')
            const matcher = RegExp(`^${expectedUrl}$`);
            mock.onGet(matcher).reply(async (config) => {
              await new Promise((resolve) => setTimeout(resolve, 300));
              let params: URLSearchParams = config.params;
              expect(params.getAll('id')).toEqual([projection1.projectionId, projection2.projectionId]);
              return [200, response];
            });
          }
        ]);

    const projections = await projectionsClient.listSingleProjections({
      projectionName: 'user-projection'
    }, requestOptions);

    expect(projections).toStrictEqual(response)
  });

  it('Can count single projections', async () => {
    const projectionsClient = Serialized.create(randomKeyConfig()).projectionsClient()

    const request: CountSingleProjectionRequest = {projectionName: 'user-projection'};

    mockClient(
        projectionsClient.axiosClient,
        [
          mockGetOk(RegExp(`^${(ProjectionsClient.singleProjectionsCountUrl('user-projection'))}$`), {count: 10}),
        ]);

    const projections = await projectionsClient.countSingleProjections(request);

    expect(projections).toStrictEqual(10)
  });

  it('Can count single projections for multi tenant projects', async () => {
    const projectionsClient = Serialized.create(randomKeyConfig()).projectionsClient()

    const request: CountSingleProjectionRequest = {projectionName: 'user-projection'};
    const tenantId = uuidv4();

    mockClient(
        projectionsClient.axiosClient,
        [
          (mock) => {
            const expectedUrl = ProjectionsClient.singleProjectionsCountUrl('user-projection')
            const matcher = RegExp(`^${expectedUrl}$`);
            mock.onGet(matcher).reply(async (config) => {
              await new Promise((resolve) => setTimeout(resolve, 300));
              expect(config.headers['Serialized-Tenant-Id']).toStrictEqual(tenantId);
              return [200, {count: 10}];
            });
          }
        ])

    const projections = await projectionsClient.countSingleProjections(request, {tenantId});

    expect(projections).toStrictEqual(10)
  });

  it('Can get single projection for multi tenant projects', async () => {
    const projectionsClient = Serialized.create(randomKeyConfig()).projectionsClient()

    const projectionId = uuidv4();
    const projectionName = 'user-projection';
    const request: GetSingleProjectionRequest = {projectionName, projectionId};
    const tenantId = uuidv4();

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
            const expectedUrl = ProjectionsClient.singleProjectionUrl(projectionName, projectionId)
            const matcher = RegExp(`^${expectedUrl}$`);
            mock.onGet(matcher).reply(async (config) => {
              await new Promise((resolve) => setTimeout(resolve, 300));
              expect(config.headers['Serialized-Tenant-Id']).toStrictEqual(tenantId);
              return [200, projectionResponse];
            });
          }
        ])

    const response = await projectionsClient.getSingleProjection(request, {tenantId});
    expect(response).toStrictEqual(projectionResponse)
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

  it('Can delete projection definition', async () => {

    const projectionsClient = Serialized.create(randomKeyConfig()).projectionsClient()
    const projectionName = 'user-projection';
    const request: DeleteProjectionDefinitionRequest = {projectionName};
    mockClient(
        projectionsClient.axiosClient,
        [
          (mock) => {
            const expectedUrl = ProjectionsClient.projectionDefinitionUrl('user-projection')
            const matcher = RegExp(`^${expectedUrl}$`);
            mock.onDelete(matcher).reply(async (config) => {
              await new Promise((resolve) => setTimeout(resolve, 300));
              return [200];
            });
          }
        ]);

    await projectionsClient.deleteProjectionDefinition(request);
  })

  it('Can delete projections for multi tenant project', async () => {

    const projectionsClient = Serialized.create(randomKeyConfig()).projectionsClient()
    const projectionName = 'user-projection';
    const tenantId = uuidv4();
    const request: DeleteProjectionsRequest = {
      projectionType: ProjectionType.SINGLE,
      projectionName
    };
    mockClient(
        projectionsClient.axiosClient,
        [
          (mock) => {
            const expectedUrl = ProjectionsClient.singleProjectionsUrl('user-projection')
            const matcher = RegExp(`^${expectedUrl}$`);
            mock.onDelete(matcher).reply(async (config) => {
              await new Promise((resolve) => setTimeout(resolve, 300));
              expect(config.headers['Serialized-Tenant-Id']).toStrictEqual(tenantId);
              return [200];
            });
          }
        ]);
    await projectionsClient.deleteProjections(request, {tenantId});
  })

  it('Can delete aggregated projections for multi tenant project', async () => {

    const projectionsClient = Serialized.create(randomKeyConfig()).projectionsClient()
    const projectionName = 'user-projection';
    const tenantId = uuidv4();
    const request: DeleteProjectionsRequest = {
      projectionType: ProjectionType.AGGREGATED,
      projectionName
    };
    mockClient(
        projectionsClient.axiosClient,
        [
          (mock) => {
            const expectedUrl = ProjectionsClient.aggregatedProjectionUrl('user-projection')
            const matcher = RegExp(`^${expectedUrl}$`);
            mock.onDelete(matcher).reply(async (config) => {
              await new Promise((resolve) => setTimeout(resolve, 300));
              expect(config.headers['Serialized-Tenant-Id']).toStrictEqual(tenantId);
              return [200];
            });
          }
        ]);
    await projectionsClient.deleteProjections(request, {tenantId});
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

  it('Should hide credentials in case of missing projection', async () => {

    const projectionsClient = Serialized.create(randomKeyConfig()).projectionsClient()
    mockClient(
        projectionsClient.axiosClient,
        [
          (mock) => {
            const expectedUrl = ProjectionsClient.projectionDefinitionUrl('user-projection');
            const matcher = RegExp(`^${expectedUrl}$`);
            mock.onGet(matcher).reply(async () => {
              await new Promise((resolve) => setTimeout(resolve, 300));
              return [404];
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
