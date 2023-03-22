import {
  CountSingleProjectionRequest,
  CreateProjectionDefinitionRequest,
  DeleteProjectionDefinitionRequest,
  GetAggregatedProjectionResponse,
  isUnauthorizedError,
  ListSingleProjectionsResponse,
  ProjectionInstance,
  ProjectionsClient,
  ProjectionType,
  Serialized
} from "../../lib";
import {v4 as uuidv4} from 'uuid';
import {DataMatcherMap} from "nock";
import {isProjectionNotFound, ProjectionNotFound} from "../../lib/error";

const {randomKeyConfig, mockSerializedApiCalls} = require("./client-helpers");
import nock = require("nock");

describe('Projections client', () => {

  afterEach(function () {
    nock.cleanAll()
  })

  it('Can get single projection by id', async () => {

    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
    const projectionName = 'user-registration';
    const projectionId = uuidv4();

    const projectionResponse: ProjectionInstance = {
      projectionId: projectionId,
      createdAt: 0,
      updatedAt: 0,
      data: {
        userName: 'johndoe'
      }
    };

    mockSerializedApiCalls(config)
        .get(ProjectionsClient.singleProjectionUrl(projectionName, projectionId))
        .reply(200, projectionResponse, {'Access-Control-Allow-Origin': '*'})

    const result = await projectionsClient.getSingleProjection({projectionId, projectionName});
    expect(result).toStrictEqual(projectionResponse)
  })

  it(`Returns ${ProjectionNotFound.name} for missing single projection`, async () => {

    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
    const projectionName = 'some-projection';
    const projectionId = uuidv4();

    mockSerializedApiCalls(config)
        .get(ProjectionsClient.singleProjectionUrl(projectionName, projectionId))
        .reply(404, {message: 'Projection not found'}, {'Access-Control-Allow-Origin': '*'})

    try {
      await projectionsClient.getSingleProjection({projectionId, projectionName});
      fail('Should throw')
    } catch (err) {
      if (isProjectionNotFound(err)) {
        expect(err.projectionName).toStrictEqual(projectionName)
        expect(err.projectionId).toStrictEqual(projectionId)
      } else {
        fail(`Should return ${ProjectionNotFound.name}`)
      }
    }

  })

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

    mockSerializedApiCalls(config)
        .get(ProjectionsClient.aggregatedProjectionUrl(projectionName))
        .reply(200, projectionResponse, {'Access-Control-Allow-Origin': '*'})

    const result = await projectionsClient.getAggregatedProjection({projectionName});
    expect(result).toStrictEqual(projectionResponse)
  })

  it('Can list single projections', async () => {
    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
    const projectionName = 'some-projection';

    const projectionResponse: ListSingleProjectionsResponse = {
      hasMore: false,
      projections: [{
        projectionId: uuidv4(),
        createdAt: new Date().getTime(),
        data: {
          someField: 'someValue'
        },
        updatedAt: new Date().getTime() + 1
      }],
      totalCount: 0
    }

    mockSerializedApiCalls(config)
        .get(ProjectionsClient.singleProjectionsUrl(projectionName))
        .query({'limit': 10, 'skip': 15, 'sort': 'projectionId', reference: 'my-ref'})
        .reply(200, projectionResponse, {'Access-Control-Allow-Origin': '*'})

    const result = await projectionsClient.listSingleProjections({
      projectionName,
      skip: 15,
      limit: 10,
      sort: 'projectionId',
      reference: 'my-ref'
    });
    expect(result).toStrictEqual(projectionResponse)
  })

  it('Can list all single projections', async () => {
    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
    const projectionName = 'some-projection';

    const page1 = {
      "projections": [
        {
          "projectionId": "22c3780f-6dcb-440f-8532-6693be83f21c",
          "createdAt": 1523518143967,
          "updatedAt": 1523518144467,
          "data": {
            "value": "a"
          }
        },
        {
          "projectionId": "b7af1219-d8f1-4b80-85f3-9ac79e26a6d5",
          "createdAt": 1523518143967,
          "updatedAt": 1523518144467,
          "data": {
            "value": "b"
          }
        }
      ],
      "hasMore": true,
      "totalCount": 4
    }

    const page2 = {
      "projections": [
        {
          "projectionId": "a1e35a90-d85c-4ada-b438-7ef3a4876568",
          "createdAt": 1523518143967,
          "updatedAt": 1523518144467,
          "data": {
            "value": "c"
          }
        },
        {
          "projectionId": "75e8a482-f2c5-4520-959e-be4c97736bd6",
          "createdAt": 1523518143967,
          "updatedAt": 1523518144467,
          "data": {
            "value": "d"
          }
        }
      ],
      "hasMore": false,
      "totalCount": 4
    }

    mockSerializedApiCalls(config)
        .get(ProjectionsClient.singleProjectionsUrl(projectionName))
        .query({'limit': 1000, 'skip': 0})
        .reply(200, page1, {'Access-Control-Allow-Origin': '*'})

        .get(ProjectionsClient.singleProjectionsUrl(projectionName))
        .query({'limit': 1000, 'skip': 1000})
        .reply(200, page2, {'Access-Control-Allow-Origin': '*'})

    const result = await projectionsClient.listAllProjections({
      projectionName,
    });
    expect(result).toStrictEqual({
      hasMore: false,
      totalCount: page1.totalCount + page2.totalCount,
      projections: [...page1.projections, ...page2.projections]
    })
  })

  it('Can list single projections without options', async () => {
    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
    const projectionName = 'some-projection';
    const projectionResponse: ListSingleProjectionsResponse = {
      hasMore: false,
      projections: [{
        projectionId: uuidv4(),
        createdAt: new Date().getTime(),
        data: {
          someField: 'someValue'
        },
        updatedAt: new Date().getTime() + 1
      }],
      totalCount: 0
    }

    mockSerializedApiCalls(config)
        .get(ProjectionsClient.singleProjectionsUrl(projectionName))
        .reply(200, projectionResponse, {'Access-Control-Allow-Origin': '*'})

    const result = await projectionsClient.listSingleProjections({projectionName});
    expect(result).toStrictEqual(projectionResponse)

  })

  it('Can list single projections with specified ids', async () => {

    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
    const projectionName = 'user-projection';

    const projection1: ProjectionInstance = {
      projectionId: uuidv4(),
      createdAt: 0,
      updatedAt: 0,
      data: {
        userName: 'johndoe'
      }
    };

    const projection2: ProjectionInstance = {
      projectionId: uuidv4(),
      createdAt: 0,
      updatedAt: 0,
      data: {
        userName: 'lisadoe'
      }
    };

    const response: ListSingleProjectionsResponse = {
      hasMore: false,
      projections: [projection1, projection2],
      totalCount: 2
    }

    mockSerializedApiCalls(config)
        .get(ProjectionsClient.singleProjectionsUrl(projectionName))
        .query({'id': [projection1.projectionId, projection2.projectionId]} as DataMatcherMap)
        .reply(200, response, {'Access-Control-Allow-Origin': '*'})

    const result = await projectionsClient.listSingleProjections({
      projectionName,
      ids: [projection1.projectionId, projection2.projectionId]
    });
    expect(result).toStrictEqual(response)
  })

  it('Can list single projections between references', async () => {
    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
    const projectionName = 'some-projection';

    const projectionResponse: ListSingleProjectionsResponse = {
      hasMore: false,
      projections: [{
        projectionId: uuidv4(),
        createdAt: new Date().getTime(),
        data: {
          someField: 'someValue'
        },
        updatedAt: new Date().getTime() + 1
      }],
      totalCount: 0
    }

    mockSerializedApiCalls(config)
        .get(ProjectionsClient.singleProjectionsUrl(projectionName))
        .query({'limit': 10, 'skip': 15, 'sort': 'projectionId', from: '200', to: '500'})
        .reply(200, projectionResponse, {'Access-Control-Allow-Origin': '*'})

    const result = await projectionsClient.listSingleProjections({
      projectionName,
      skip: 15,
      limit: 10,
      sort: 'projectionId',
      from: '200',
      to: '500'
    });
    expect(result).toStrictEqual(projectionResponse)
  })

  it('Can search single projections', async () => {
    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
    const projectionName = 'some-projection';

    const projectionResponse: ListSingleProjectionsResponse = {
      hasMore: false,
      projections: [{
        projectionId: uuidv4(),
        createdAt: new Date().getTime(),
        data: {
          someField: 'someValue'
        },
        updatedAt: new Date().getTime() + 1
      }],
      totalCount: 0
    }

    mockSerializedApiCalls(config)
        .get(ProjectionsClient.singleProjectionsUrl(projectionName))
        .query({'search': 'some-string'})
        .reply(200, projectionResponse, {'Access-Control-Allow-Origin': '*'})

    const result = await projectionsClient.listSingleProjections({
      projectionName,
      search: 'some-string'
    });
    expect(result).toStrictEqual(projectionResponse)
  })

  it('Can count single projections', async () => {

    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
    const request: CountSingleProjectionRequest = {projectionName: 'user-projection'};
    const projectionName = 'user-projection';
    const response = {
      count: 10
    };

    mockSerializedApiCalls(config)
        .get(ProjectionsClient.singleProjectionsCountUrl(projectionName))
        .reply(200, response, {'Access-Control-Allow-Origin': '*'})

    const result = await projectionsClient.countSingleProjections(request);
    expect(result).toStrictEqual(10)
  })

  it('Can count single projections for multi tenant projects', async () => {

    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
    const projectionName = 'user-projection';
    const tenantId = uuidv4();
    const response = {
      count: 10
    };

    mockSerializedApiCalls(config, tenantId)
        .get(ProjectionsClient.singleProjectionsCountUrl(projectionName))
        .reply(200, response, {'Access-Control-Allow-Origin': '*'})

    const result = await projectionsClient.countSingleProjections({projectionName, tenantId});
    expect(result).toStrictEqual(10)
  })

  it('Can get single projection for multi tenant projects', async () => {

    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
    const projectionId = uuidv4();
    const projectionName = 'user-projection';
    const tenantId = uuidv4();

    const projectionResponse: ProjectionInstance = {
      projectionId: projectionId,
      createdAt: 0,
      updatedAt: 0,
      data: {
        userName: 'johndoe'
      }
    };

    mockSerializedApiCalls(config, tenantId)
        .get(ProjectionsClient.singleProjectionUrl(projectionName, projectionId))
        .reply(200, projectionResponse)

    const result = await projectionsClient.getSingleProjection({projectionId, projectionName, tenantId});
    expect(result).toStrictEqual(projectionResponse)
  })

  it('Can delete projections for multi tenant project', async () => {

    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
    const projectionName = 'user-projection';
    const tenantId = uuidv4();

    mockSerializedApiCalls(config, tenantId)
        .delete(ProjectionsClient.singleProjectionsUrl(projectionName))
        .reply(200)

    await projectionsClient.delete({
      projectionType: ProjectionType.SINGLE,
      projectionName,
      tenantId
    });
  })

  it('Can delete aggregated projections for multi tenant project', async () => {

    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
    const projectionName = 'user-projection';
    const tenantId = uuidv4();

    mockSerializedApiCalls(config, tenantId)
        .delete(ProjectionsClient.aggregatedProjectionUrl(projectionName))
        .reply(200)

    await projectionsClient.delete({
      projectionType: ProjectionType.AGGREGATED,
      projectionName,
      tenantId
    });
  })

  it('Can load a projection definition', async () => {

    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
    const projectionName = 'todo-list-summaries';
    const projectionDefinition = {
      feedName: 'todo-lists',
      description: 'This is a description of todo lists',
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

    mockSerializedApiCalls(config)
        .get(ProjectionsClient.projectionDefinitionUrl(projectionName))
        .reply(200, projectionDefinition)


    const result = await projectionsClient.getProjectionDefinition({projectionName});
    expect(result).toStrictEqual(projectionDefinition)
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

    mockSerializedApiCalls(config)
        .post(ProjectionsClient.projectionDefinitionsUrl())
        .reply(200, projectionDefinition)

    await projectionsClient.createDefinition(projectionDefinition);
  })

  it('Can create a projection definition with handler-level feed name', async () => {

    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
    const projectionName = 'user-projection';
    const projectionDefinition = {
      projectionName,
      handlers: [
        {
          feedName: 'user-registration',
          eventType: 'UserRegisteredEvent',
          idField: 'userId',
          functions: [
            {
              function: 'merge',
            }
          ],
        }
      ]
    };

    mockSerializedApiCalls(config)
        .post(ProjectionsClient.projectionDefinitionsUrl(),
            body => {
              const feedNameMatches = body.handlers[0].feedName === 'user-registration';
              const idFieldMatches = body.handlers[0].idField === 'userId';
              return feedNameMatches && idFieldMatches
            })
        .reply(200, projectionDefinition)

    await projectionsClient.createDefinition(projectionDefinition);
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

    mockSerializedApiCalls(config)
        .put(ProjectionsClient.projectionDefinitionUrl(projectionName), body => {
          return body.signingSecret === signingSecret
        })
        .reply(200, projectionDefinition)

    await projectionsClient.createOrUpdateDefinition(projectionDefinition);
  })

  it('Can create projection definition with raw data', async () => {

    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
    const projectionName = 'user-projection';
    const projectionDefinition: CreateProjectionDefinitionRequest = {
      feedName: 'user-registration',
      projectionName: projectionName,
      handlers: [
        {
          eventType: 'UserRegisteredEvent',
          functions: [
            {
              function: 'merge',
              rawData: {'key': 'value'}
            }
          ],
        }
      ]
    };

    mockSerializedApiCalls(config)
        .put(ProjectionsClient.projectionDefinitionUrl(projectionName), requestData => {
          expect(requestData.handlers[0].functions[0].rawData).toStrictEqual({'key': 'value'})
          return true
        })
        .reply(200, projectionDefinition)

    await projectionsClient.createOrUpdateDefinition(projectionDefinition);
  })

  it('Can create projection definition with indexed fields', async () => {

    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
    const projectionName = 'user-projection';
    const projectionDefinition: CreateProjectionDefinitionRequest = {
      feedName: 'user-registration',
      projectionName: projectionName,
      indexedFields: ['name', 'email'],
      handlers: [
        {
          eventType: 'UserRegisteredEvent',
          functions: [
            {
              function: 'merge'
            }
          ],
        }
      ]
    };

    mockSerializedApiCalls(config)
        .put(ProjectionsClient.projectionDefinitionUrl(projectionName), requestData => {
          expect(requestData.indexedFields).toStrictEqual(['name', 'email'])
          return true
        })
        .reply(200, projectionDefinition)

    await projectionsClient.createOrUpdateDefinition(projectionDefinition);
  })

  it('Can delete projection definition', async () => {

    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
    const projectionName = 'user-projection';
    const request: DeleteProjectionDefinitionRequest = {projectionName};

    mockSerializedApiCalls(config)
        .delete(ProjectionsClient.projectionDefinitionUrl(projectionName))
        .reply(200)

    await projectionsClient.deleteProjectionDefinition(request);
  })

  it('Should not expose credentials in case of auth error', async () => {

    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
    const projectionName = 'user-projection';

    mockSerializedApiCalls(config)
        .get(ProjectionsClient.projectionDefinitionUrl(projectionName))
        .reply(401);

    try {
      await projectionsClient.getProjectionDefinition({projectionName});
      fail('Should throw an unauthorized error')
    } catch (error) {
      if (isUnauthorizedError(error)) {
        expect(error.requestUrl).toStrictEqual(`/projections/definitions/${projectionName}`)
      } else {
        fail('Should be unauthorized error')
      }
    }
  })

})
