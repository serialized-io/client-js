import {BaseClient} from "./";

export interface DeleteTenantRequest {
  tenantId: string;
}

export interface UpdateTenantRequest {
  tenantId: string;
  reference?: string;
}

export interface AddTenantRequest {
  tenantId: string;
  reference?: string;
}

export class TenantClient extends BaseClient {

  public async addTenant(request: AddTenantRequest): Promise<void> {
    await this.axiosClient.post(TenantClient.tenantRootUrl(), request);
  }

  public async updateTenant(request: UpdateTenantRequest): Promise<void> {
    await this.axiosClient.put(TenantClient.tenantUrl(request.tenantId), request, this.axiosConfig());
  };

  public async deleteTenant(request: DeleteTenantRequest): Promise<void> {
    await this.axiosClient.delete(TenantClient.tenantUrl(request.tenantId));
  };

  public static tenantUrl(tenantId: string) {
    return `/tenants/${tenantId}`;
  }

  public static tenantRootUrl() {
    return `/tenants`;
  }

}
