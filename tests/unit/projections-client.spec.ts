import {
  CountSingleProjectionRequest,
  CreateProjectionDefinitionRequest,
  DeleteProjectionDefinitionRequest,
  DeleteProjectionsRequest,
  GetAggregatedProjectionResponse,
  GetSingleProjectionResponse,
  isUnauthorizedError,
  ListSingleProjectionOptions,
  ListSingleProjectionsResponse,
  ProjectionsClient,
  ProjectionType,
  Serialized
} from "../../lib";
import {v4 as uuidv4} from 'uuid';
import {DataMatcherMap} from "nock";
import {isProjectionNotFound, ProjectionNotFound} from "../../lib/error";
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

    const projectionResponse: GetSingleProjectionResponse = {
      projectionId: projectionId,
      createdAt: 0,
      updatedAt: 0,
      data: {
        userName: 'johndoe'
      }
    };

    nock('https://api.serialized.io')
        .get(ProjectionsClient.singleProjectionUrl(projectionName, projectionId))
        .matchHeader('Serialized-Access-Key', config.accessKey)
        .matchHeader('Serialized-Secret-Access-Key', config.secretAccessKey)
        .reply(200, projectionResponse, {'Access-Control-Allow-Origin': '*'})
        .get(ProjectionsClient.singleProjectionUrl(projectionName, projectionId))
        .reply(401)

    const result = await projectionsClient.getSingleProjection({projectionId, projectionName});
    expect(result).toStrictEqual(projectionResponse)
  })

  it(`Returns ${ProjectionNotFound.name} for missing single projection`, async () => {

    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
    const projectionName = 'some-projection';
    const projectionId = uuidv4();

    nock('https://api.serialized.io')
        .get(ProjectionsClient.singleProjectionUrl(projectionName, projectionId))
        .matchHeader('Serialized-Access-Key', config.accessKey)
        .matchHeader('Serialized-Secret-Access-Key', config.secretAccessKey)
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

    nock('https://api.serialized.io')
        .get(ProjectionsClient.aggregatedProjectionUrl(projectionName))
        .matchHeader('Serialized-Access-Key', config.accessKey)
        .matchHeader('Serialized-Secret-Access-Key', config.secretAccessKey)
        .reply(200, projectionResponse, {'Access-Control-Allow-Origin': '*'})

    const result = await projectionsClient.getAggregatedProjection({projectionName});
    expect(result).toStrictEqual(projectionResponse)
  })

  it('Can list single projections', async () => {
    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
    const projectionName = 'some-projection';
    const requestOptions: ListSingleProjectionOptions = {
      skip: 15,
      limit: 10,
      sort: 'projectionId',
      reference: 'my-ref'
    };

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

    nock('https://api.serialized.io')
        .get(ProjectionsClient.singleProjectionsUrl(projectionName))
        .matchHeader('Serialized-Access-Key', config.accessKey)
        .matchHeader('Serialized-Secret-Access-Key', config.secretAccessKey)
        .query({'limit': 10, 'skip': 15, 'sort': 'projectionId', reference: 'my-ref'})
        .reply(200, projectionResponse, {'Access-Control-Allow-Origin': '*'})

    const result = await projectionsClient.listSingleProjections({projectionName}, requestOptions);
    expect(result).toStrictEqual(projectionResponse)
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

    nock('https://api.serialized.io')
        .get(ProjectionsClient.singleProjectionsUrl(projectionName))
        .matchHeader('Serialized-Access-Key', config.accessKey)
        .matchHeader('Serialized-Secret-Access-Key', config.secretAccessKey)
        .reply(200, projectionResponse, {'Access-Control-Allow-Origin': '*'})

    const result = await projectionsClient.listSingleProjections({projectionName});
    expect(result).toStrictEqual(projectionResponse)

  })

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
      id: [projection1.projectionId, projection2.projectionId]
    };

    const response: ListSingleProjectionsResponse = {
      hasMore: false,
      projections: [projection1, projection2],
      totalCount: 2
    }

    nock('https://api.serialized.io')
        .get(ProjectionsClient.singleProjectionsUrl(projectionName))
        .matchHeader('Serialized-Access-Key', config.accessKey)
        .matchHeader('Serialized-Secret-Access-Key', config.secretAccessKey)
        .query({'id': [projection1.projectionId, projection2.projectionId]} as DataMatcherMap)
        .reply(200, response, {'Access-Control-Allow-Origin': '*'})

    const result = await projectionsClient.listSingleProjections({projectionName}, requestOptions);
    expect(result).toStrictEqual(response)
  })

  it('Can count single projections', async () => {

    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
    const request: CountSingleProjectionRequest = {projectionName: 'user-projection'};
    const projectionName = 'user-projection';
    const response = {
      count: 10
    };

    nock('https://api.serialized.io')
        .get(ProjectionsClient.singleProjectionsCountUrl(projectionName))
        .matchHeader('Serialized-Access-Key', config.accessKey)
        .matchHeader('Serialized-Secret-Access-Key', config.secretAccessKey)
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

    nock('https://api.serialized.io')
        .get(ProjectionsClient.singleProjectionsCountUrl(projectionName))
        .matchHeader('Serialized-Access-Key', config.accessKey)
        .matchHeader('Serialized-Secret-Access-Key', config.secretAccessKey)
        .matchHeader('Serialized-Tenant-Id', tenantId)
        .reply(200, response, {'Access-Control-Allow-Origin': '*'})

    const result = await projectionsClient.countSingleProjections({projectionName}, {tenantId});
    expect(result).toStrictEqual(10)
  })

  it('Can get single projection for multi tenant projects', async () => {

    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
    const projectionId = uuidv4();
    const projectionName = 'user-projection';
    const tenantId = uuidv4();

    const projectionResponse: GetSingleProjectionResponse = {
      projectionId: projectionId,
      createdAt: 0,
      updatedAt: 0,
      data: {
        userName: 'johndoe'
      }
    };

    nock('https://api.serialized.io')
        .get(ProjectionsClient.singleProjectionUrl(projectionName, projectionId))
        .matchHeader('Serialized-Access-Key', config.accessKey)
        .matchHeader('Serialized-Secret-Access-Key', config.secretAccessKey)
        .matchHeader('Serialized-Tenant-Id', tenantId)
        .reply(200, projectionResponse)
        .get(ProjectionsClient.singleProjectionUrl(projectionName, projectionId))
        .reply(401)

    const result = await projectionsClient.getSingleProjection({projectionId, projectionName}, {tenantId});
    expect(result).toStrictEqual(projectionResponse)
  })

  it('Can delete single projections', async () => {

    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
    const projectionName = 'user-projection';
    const request = {projectionName};

    nock('https://api.serialized.io')
        .delete(ProjectionsClient.singleProjectionsUrl(projectionName))
        .matchHeader('Serialized-Access-Key', config.accessKey)
        .matchHeader('Serialized-Secret-Access-Key', config.secretAccessKey)
        .reply(200)
        .delete(ProjectionsClient.singleProjectionsUrl(projectionName))
        .reply(401)

    await projectionsClient.recreateSingleProjections(request);
  })

  it('Can delete aggregated projections', async () => {

    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
    const projectionName = 'user-projection';
    const request = {projectionName};

    nock('https://api.serialized.io')
        .delete(ProjectionsClient.aggregatedProjectionUrl(projectionName))
        .matchHeader('Serialized-Access-Key', config.accessKey)
        .matchHeader('Serialized-Secret-Access-Key', config.secretAccessKey)
        .reply(200)
        .delete(ProjectionsClient.aggregatedProjectionUrl(projectionName))
        .reply(401)

    await projectionsClient.recreateAggregatedProjection(request);
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

    nock('https://api.serialized.io')
        .delete(ProjectionsClient.singleProjectionsUrl(projectionName))
        .matchHeader('Serialized-Access-Key', config.accessKey)
        .matchHeader('Serialized-Secret-Access-Key', config.secretAccessKey)
        .matchHeader('Serialized-Tenant-Id', tenantId)
        .reply(200)
        .delete(ProjectionsClient.singleProjectionsUrl(projectionName))
        .reply(401)

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

    nock('https://api.serialized.io')
        .delete(ProjectionsClient.aggregatedProjectionUrl(projectionName))
        .matchHeader('Serialized-Access-Key', config.accessKey)
        .matchHeader('Serialized-Secret-Access-Key', config.secretAccessKey)
        .matchHeader('Serialized-Tenant-Id', tenantId)
        .reply(200)
        .delete(ProjectionsClient.aggregatedProjectionUrl(projectionName))
        .reply(401)

    await projectionsClient.deleteProjections(request, {tenantId});
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

    nock('https://api.serialized.io')
        .get(ProjectionsClient.projectionDefinitionUrl(projectionName))
        .matchHeader('Serialized-Access-Key', config.accessKey)
        .matchHeader('Serialized-Secret-Access-Key', config.secretAccessKey)
        .reply(200, projectionDefinition)
        .get(ProjectionsClient.projectionDefinitionUrl(projectionName))
        .reply(401)

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

    nock('https://api.serialized.io')
        .put(ProjectionsClient.projectionDefinitionUrl(projectionName))
        .matchHeader('Serialized-Access-Key', config.accessKey)
        .matchHeader('Serialized-Secret-Access-Key', config.secretAccessKey)
        .reply(200, projectionDefinition)
        .put(ProjectionsClient.projectionDefinitionUrl(projectionName))
        .reply(401)

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

    nock('https://api.serialized.io')
        .put(ProjectionsClient.projectionDefinitionUrl(projectionName), body => {
          return body.signingSecret === signingSecret
        })
        .matchHeader('Serialized-Access-Key', config.accessKey)
        .matchHeader('Serialized-Secret-Access-Key', config.secretAccessKey)
        .reply(200, projectionDefinition)
        .put(ProjectionsClient.projectionDefinitionUrl(projectionName))
        .reply(401)

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

    nock('https://api.serialized.io')
        .put(ProjectionsClient.projectionDefinitionUrl(projectionName), requestData => {
          expect(requestData.handlers[0].functions[0].rawData).toStrictEqual({'key': 'value'})
          return true
        })
        .matchHeader('Serialized-Access-Key', config.accessKey)
        .matchHeader('Serialized-Secret-Access-Key', config.secretAccessKey)
        .reply(200, projectionDefinition)
        .put(ProjectionsClient.projectionDefinitionUrl(projectionName))
        .reply(401)

    await projectionsClient.createOrUpdateDefinition(projectionDefinition);
  })

  it('Can delete projection definition', async () => {

    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(config).projectionsClient()
    const projectionName = 'user-projection';
    const request: DeleteProjectionDefinitionRequest = {projectionName};

    nock('https://api.serialized.io')
        .delete(ProjectionsClient.projectionDefinitionUrl(projectionName))
        .matchHeader('Serialized-Access-Key', config.accessKey)
        .matchHeader('Serialized-Secret-Access-Key', config.secretAccessKey)
        .reply(200)
        .delete(ProjectionsClient.projectionDefinitionUrl(projectionName))
        .reply(401);

    await projectionsClient.deleteProjectionDefinition(request);
  })

  it('Should not expose credentials in case of auth error', async () => {

    const config = randomKeyConfig();
    const projectionsClient = Serialized.create(randomKeyConfig()).projectionsClient()
    const projectionName = 'user-projection';

    nock('https://api.serialized.io')
        .get(ProjectionsClient.projectionDefinitionUrl(projectionName))
        .matchHeader('Serialized-Access-Key', config.accessKey)
        .matchHeader('Serialized-Secret-Access-Key', config.secretAccessKey)
        .reply(200)
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

  function randomKeyConfig() {
    return {accessKey: uuidv4(), secretAccessKey: uuidv4()};
  }

})
