import {DeleteTenantRequest, Serialized, TenantClient, UpdateTenantRequest} from "../../lib";
import {v4 as uuidv4} from "uuid";
import MockAdapter from "axios-mock-adapter";

const {randomKeyConfig, mockClient} = require("./client-helpers");

describe('Tenant client', () => {

  it('Can update tenant reference', async () => {
    const tenantClient = Serialized.create(randomKeyConfig()).tenantClient();
    const tenantId = uuidv4();
    const reference = 'some-customer';
    const request: UpdateTenantRequest = {
      tenantId,
      reference
    }

    mockClient(
        tenantClient.axiosClient,
        [
          (mock: MockAdapter) => {
            mock.onPut(RegExp(`^${TenantClient.tenantUrl(tenantId)}$`))
                .reply(async (config) => {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  expect(JSON.parse(config.data).tenantId).toStrictEqual(tenantId)
                  expect(JSON.parse(config.data).reference).toStrictEqual(reference)
                  return [200];
                });
          }
        ]);

    await tenantClient.updateTenant(request)
  })

  it('Can delete a tenant', async () => {
    const tenantClient = Serialized.create(randomKeyConfig()).tenantClient();
    const tenantId = uuidv4();
    const request: DeleteTenantRequest = {
      tenantId
    }

    mockClient(
        tenantClient.axiosClient,
        [
          (mock: MockAdapter) => {
            mock.onDelete(RegExp(`^${TenantClient.tenantUrl(tenantId)}$`))
                .reply(async (request) => {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  return [200];
                });
          }
        ]);

    await tenantClient.deleteTenant(request)
  })

})
