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

const {
  mockClient,
  randomKeyConfig,
  assertMatchesSingleTenantRequestHeaders,
  assertMatchesMultiTenantRequestHeaders
} = require("./client-helpers");

describe('Projections client', () => {

  it('Can get single projection by id', async () => {

    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
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

            mock.onGet(RegExp(`^${ProjectionsClient.singleProjectionUrl(projectionName, projectionId)}$`))
                .reply(async (request) => {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  assertMatchesSingleTenantRequestHeaders(request, config)
                  return [200, projectionResponse];
                });
          }
        ])

    const projection = await projectionsClient.getSingleProjection({projectionId, projectionName});
    expect(projection).toStrictEqual(projectionResponse)
  });

  it('Can load aggregated projection', async () => {

    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
    const projectionName = 'users-projection';
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
          (mock) => {
            mock.onGet(RegExp(`^${ProjectionsClient.aggregatedProjectionUrl(projectionName)}$`))
                .reply(async (request) => {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  assertMatchesSingleTenantRequestHeaders(request, config);
                  return [200, projectionResponse];
                });
          }
        ]);

    const projection = await projectionsClient.getAggregatedProjection({projectionName});
    expect(projection).toStrictEqual(projectionResponse)

  });

  it('Can list single projections', async () => {
    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
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
            mock.onGet(RegExp(`^${ProjectionsClient.singleProjectionsUrl('user-projection')}$`))
                .reply(async (request) => {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  const params: URLSearchParams = request.params;
                  assertMatchesSingleTenantRequestHeaders(request, config)
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

  it('Can can filter single projections by reference', async () => {
    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
    const requestOptions: ListSingleProjectionOptions = {
      reference: 'myref',
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
            mock.onGet(RegExp(`^${ProjectionsClient.singleProjectionsUrl('user-projection')}$`))
                .reply(async (request) => {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  const params: URLSearchParams = request.params;
                  assertMatchesSingleTenantRequestHeaders(request, config)
                  expect(params.get('reference')).toStrictEqual('myref')
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

    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
    const projectionName = 'user-projection';
    const zeroProjectionsResponse: ListSingleProjectionsResponse = {
      hasMore: false,
      projections: [],
      totalCount: 0
    }
    mockClient(
        projectionsClient.axiosClient,
        [
          (mock) => {
            mock.onGet(RegExp(`^${ProjectionsClient.singleProjectionsUrl(projectionName)}$`))
                .reply(async (request) => {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  assertMatchesSingleTenantRequestHeaders(request, config)
                  return [200, zeroProjectionsResponse];
                });
          }
        ])

    const projections = await projectionsClient.listSingleProjections({projectionName});
    expect(projections).toStrictEqual(zeroProjectionsResponse)
  });

  it('Can list single projections with specified ids', async () => {

    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
    const projectionName = 'user-projection';

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
            mock.onGet(RegExp(`^${ProjectionsClient.singleProjectionsUrl(projectionName)}$`))
                .reply(async (request) => {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  const params: URLSearchParams = request.params;
                  assertMatchesSingleTenantRequestHeaders(request, config);
                  expect(params.getAll('id')).toEqual([projection1.projectionId, projection2.projectionId]);
                  return [200, response];
                });
          }
        ]);

    const projections = await projectionsClient.listSingleProjections({projectionName}, requestOptions);
    expect(projections).toStrictEqual(response)
  });

  it('Can count single projections', async () => {

    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
    const request: CountSingleProjectionRequest = {projectionName: 'user-projection'};
    const projectionName = 'user-projection';

    mockClient(
        projectionsClient.axiosClient,
        [
          (mock) => {
            mock.onGet(RegExp(`^${ProjectionsClient.singleProjectionsCountUrl(projectionName)}$`))
                .reply(async (request) => {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  assertMatchesSingleTenantRequestHeaders(request, config)
                  return [200, {count: 10}];
                });
          }
        ])

    const projections = await projectionsClient.countSingleProjections(request);
    expect(projections).toStrictEqual(10)
  });

  it('Can count single projections for multi tenant projects', async () => {

    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
    const projectionName = 'user-projection';
    const tenantId = uuidv4();

    mockClient(
        projectionsClient.axiosClient,
        [
          (mock) => {
            mock.onGet(RegExp(`^${ProjectionsClient.singleProjectionsCountUrl(projectionName)}$`))
                .reply(async (request) => {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  assertMatchesMultiTenantRequestHeaders(request, config, tenantId);
                  return [200, {count: 10}];
                });
          }
        ])

    const projections = await projectionsClient.countSingleProjections({projectionName}, {tenantId});
    expect(projections).toStrictEqual(10)
  });

  it('Can get single projection for multi tenant projects', async () => {

    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
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
            mock.onGet(RegExp(`^${ProjectionsClient.singleProjectionUrl(projectionName, projectionId)}$`))
                .reply(async (request) => {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  assertMatchesMultiTenantRequestHeaders(request, config, tenantId);
                  return [200, projectionResponse];
                });
          }
        ])

    const response = await projectionsClient.getSingleProjection(request, {tenantId});
    expect(response).toStrictEqual(projectionResponse)
  });

  it('Can load a projection definition', async () => {

    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
    const projectionName = 'todo-list-summaries';
    const projectionDefinition = {
      feedName: 'todo-lists',
      projectionName,
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
            mock.onGet(RegExp(`^${ProjectionsClient.projectionDefinitionUrl(projectionName)}$`))
                .reply(async (request) => {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  assertMatchesSingleTenantRequestHeaders(request, config)
                  return [200, projectionDefinition];
                });
          }
        ]);

    const response = await projectionsClient.getProjectionDefinition({projectionName});
    expect(response).toStrictEqual(projectionDefinition)
  })

  it('Can create a projection definition', async () => {

    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
    const projectionName = 'user-projection';
    const projectionDefinition = {
      feedName: 'user-registration',
      projectionName,
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
            mock.onPut(RegExp(`^${ProjectionsClient.projectionDefinitionUrl(projectionName)}$`))
                .reply(async (request) => {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  assertMatchesSingleTenantRequestHeaders(request, config)
                  return [200, projectionDefinition];
                });
          }
        ]);

    await projectionsClient.createOrUpdateDefinition(projectionDefinition);
  })

  it('Can provide signing secret', async () => {

    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
    const signingSecret = 'some-secret-value';
    const projectionName = 'user-projection';
    const projectionDefinition: CreateProjectionDefinitionRequest = {
      feedName: 'user-registration',
      projectionName: projectionName,
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
            mock.onPut(RegExp(`^${ProjectionsClient.projectionDefinitionUrl(projectionName)}$`))
                .reply(async (request) => {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  assertMatchesSingleTenantRequestHeaders(request, config);
                  expect(JSON.parse(request.data).signingSecret).toStrictEqual(signingSecret)
                  return [200, projectionDefinition];
                });
          }
        ]);

    await projectionsClient.createOrUpdateDefinition(projectionDefinition);
  })

  it('Can delete projection definition', async () => {

    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
    const projectionName = 'user-projection';
    const request: DeleteProjectionDefinitionRequest = {projectionName};
    mockClient(
        projectionsClient.axiosClient,
        [
          (mock) => {
            mock.onDelete(RegExp(`^${ProjectionsClient.projectionDefinitionUrl(projectionName)}$`))
                .reply(async (request) => {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  assertMatchesSingleTenantRequestHeaders(request, config)
                  return [200];
                });
          }
        ]);

    await projectionsClient.deleteProjectionDefinition(request);
  })

  it('Can delete projections for multi tenant project', async () => {

    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
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
            mock.onDelete(RegExp(`^${ProjectionsClient.singleProjectionsUrl(projectionName)}$`))
                .reply(async (request) => {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  assertMatchesMultiTenantRequestHeaders(request, config, tenantId);
                  return [200];
                });
          }
        ]);
    await projectionsClient.deleteProjections(request, {tenantId});
  })

  it('Can delete aggregated projections for multi tenant project', async () => {

    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
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
            mock.onDelete(RegExp(`^${ProjectionsClient.aggregatedProjectionUrl(projectionName)}$`))
                .reply(async (request) => {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  assertMatchesMultiTenantRequestHeaders(request, config, tenantId);
                  return [200];
                });
          }
        ]);
    await projectionsClient.deleteProjections(request, {tenantId});
  })

  it('Should hide credentials in case of error', async () => {

    const projectionsClient = Serialized.create(randomKeyConfig()).projectionsClient()
    const projectionName = 'user-projection';

    mockClient(
        projectionsClient.axiosClient,
        [
          (mock) => {

            mock.onGet(RegExp(`^${ProjectionsClient.projectionDefinitionUrl(projectionName)}$`))
                .reply(async () => {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  return [500, {}];
                });
          }
        ]);

    try {
      await projectionsClient.getProjectionDefinition({projectionName});
      fail('Should return an error')
    } catch (e) {
      const response = e.response;
      expect(response.config.headers['Serialized-Access-Key']).toStrictEqual('******')
      expect(response.config.headers['Serialized-Secret-Access-Key']).toStrictEqual('******')
    }

  })

  it('Should hide credentials in case of missing projection', async () => {

    const projectionsClient = Serialized.create(randomKeyConfig()).projectionsClient()
    const projectionName = 'user-projection';

    mockClient(
        projectionsClient.axiosClient,
        [
          (mock) => {
            mock.onGet(RegExp(`^${ProjectionsClient.projectionDefinitionUrl(projectionName)}$`)).reply(async () => {
              await new Promise((resolve) => setTimeout(resolve, 300));
              return [404];
            });
          }
        ]);

    try {
      await projectionsClient.getProjectionDefinition({projectionName});
      fail('Should return an error')
    } catch (e) {
      const response = e.response;
      expect(response.config.headers['Serialized-Access-Key']).toStrictEqual('******')
      expect(response.config.headers['Serialized-Secret-Access-Key']).toStrictEqual('******')
    }

  })

})
