import {BaseClient} from "./BaseClient";
import {AxiosInstance} from "axios";
import {SerializedConfig} from "./types";

export interface LoadProjectionDataResponse {
  projectionId: string;
  createdAt: number;
  updatedAt: number;
  data: any;
}

export interface CustomProjectionHandler {
  functionUri: string;
}

export interface JsonPathFunction {
  function: string;
  targetSelector?: string;
  eventSelector?: string;
  targetFilter?: string;
  eventFilter?: string;
}

export interface JsonPathHandler {
  eventType: string;
  functions: JsonPathFunction[];
}

export interface LoadProjectionDefinitionResponse {
  projectionName: string;
  feedName: string,
  handlers: CustomProjectionHandler[] | JsonPathHandler[];
}

export interface CreateProjectionDefinitionRequest {
  projectionName: string;
  feedName: string;
  handlers: CustomProjectionHandler[] | JsonPathHandler[];
  aggregated?: boolean;
  idField?: string;
}

export interface ListSingleProjectionsResponse {
  projections: LoadProjectionDataResponse[];
  hasMore: boolean;
  totalCount: number;
}

export class ProjectionsClient extends BaseClient {

  constructor(axiosClient: AxiosInstance, config: SerializedConfig) {
    super(axiosClient, config);
  }

  public async createOrUpdateDefinition(request: CreateProjectionDefinitionRequest): Promise<void> {
    return (await this.axiosClient.put(`/projections/definitions/${request.projectionName}`, request, this.axiosConfig())).data;
  }

  public async deleteProjectionDefinition(projectionName: string): Promise<void> {
    return (await this.axiosClient.delete(`/projections/definitions/${projectionName}`, this.axiosConfig())).data;
  }

  public async getProjectionDefinition(projectionName: string): Promise<LoadProjectionDefinitionResponse> {
    return (await this.axiosClient.get(`/projections/definitions/${projectionName}`, this.axiosConfig())).data;
  }

  public async getSingleProjection(projectionName: string, projectionId: string, awaitCreation?: number): Promise<LoadProjectionDataResponse> {
    const config = this.axiosConfig();
    config.params = {
      awaitCreation: awaitCreation,
    }
    return (await this.axiosClient.get(`/projections/single/${projectionName}/${projectionId}`, config)).data;
  }

  public async listSingleProjections(projectionName: string): Promise<ListSingleProjectionsResponse> {
    return (await this.axiosClient.get(`/projections/single/${projectionName}`, this.axiosConfig())).data;
  }

  public async getAggregatedProjection(projectionName: string): Promise<LoadProjectionDataResponse> {
    return (await this.axiosClient.get(`/projections/aggregated/${projectionName}`, this.axiosConfig())).data;
  }

  public async recreateSingleProjections(projectionName: string): Promise<void> {
    return (await this.axiosClient.delete(`/projections/single/${projectionName}`, this.axiosConfig())).data;
  }

  public async recreateAggregatedProjection(projectionName: string): Promise<void> {
    return (await this.axiosClient.delete(`/projections/aggregated/${projectionName}`, this.axiosConfig())).data;
  }

}
