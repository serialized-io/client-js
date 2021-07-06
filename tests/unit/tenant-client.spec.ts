import {DeleteTenantRequest, Serialized, TenantClient, UpdateTenantRequest} from "../../lib";
import {v4 as uuidv4} from "uuid";
import nock = require("nock");

const {randomKeyConfig} = require("./client-helpers");

describe('Tenant client', () => {

  afterEach(function () {
    nock.cleanAll()
  })

  it('Can update tenant reference', async () => {
    let config = randomKeyConfig();
    const tenantClient = Serialized.create(config).tenantClient();
    const tenantId = uuidv4();
    const reference = 'some-customer';
    const request: UpdateTenantRequest = {
      tenantId,
      reference
    }

    nock('https://api.serialized.io')
        .put(TenantClient.tenantUrl(tenantId), request => {
          expect(request.tenantId).toStrictEqual(tenantId)
          expect(request.reference).toStrictEqual(reference)
          return true
        })
        .matchHeader('Serialized-Access-Key', config.accessKey)
        .matchHeader('Serialized-Secret-Access-Key', config.secretAccessKey)
        .reply(200)
        .put(TenantClient.tenantUrl(tenantId))
        .reply(401);

    await tenantClient.updateTenant(request)
  })

  it('Can delete a tenant', async () => {
    const config = randomKeyConfig();
    const tenantClient = Serialized.create(config).tenantClient();
    const tenantId = uuidv4();
    const request: DeleteTenantRequest = {
      tenantId
    }

    nock('https://api.serialized.io')
        .delete(TenantClient.tenantUrl(tenantId))
        .matchHeader('Serialized-Access-Key', config.accessKey)
        .matchHeader('Serialized-Secret-Access-Key', config.secretAccessKey)
        .reply(200)
        .delete(TenantClient.tenantUrl(tenantId))
        .reply(401);

    await tenantClient.deleteTenant(request)
  })

})
