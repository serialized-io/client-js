import {Serialized, TenantClient} from "../../lib";
import {v4 as uuidv4} from "uuid";
import nock = require("nock");

const {randomKeyConfig, mockSerializedApiCalls} = require("./client-helpers");

describe('Tenant client', () => {

  afterEach(function () {
    nock.cleanAll()
  })

  it('Can add tenant', async () => {
    let config = randomKeyConfig();
    const tenantClient = Serialized.create(config).tenantClient();
    const tenantId = uuidv4();
    const reference = 'some-tenant';
    mockSerializedApiCalls(config)
        .post(TenantClient.tenantRootUrl(), request => {
          expect(request.tenantId).toStrictEqual(tenantId)
          expect(request.reference).toStrictEqual(reference)
          return true
        })
        .reply(200)

    await tenantClient.addTenant({tenantId, reference})
  })

  it('Can update tenant reference', async () => {
    let config = randomKeyConfig();
    const tenantClient = Serialized.create(config).tenantClient();
    const tenantId = uuidv4();
    const reference = 'some-customer';
    mockSerializedApiCalls(config)
        .put(TenantClient.tenantUrl(tenantId), request => {
          expect(request.tenantId).toStrictEqual(tenantId)
          expect(request.reference).toStrictEqual(reference)
          return true
        })
        .reply(200)

    await tenantClient.updateTenant({tenantId, reference})
  })

  it('Can delete a tenant', async () => {
    const config = randomKeyConfig();
    const tenantClient = Serialized.create(config).tenantClient();
    const tenantId = uuidv4();
    mockSerializedApiCalls(config)
        .delete(TenantClient.tenantUrl(tenantId))
        .reply(200)

    await tenantClient.deleteTenant({tenantId})
  })

})
