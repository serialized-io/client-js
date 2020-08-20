import {BaseClient} from "./BaseClient";
import {AxiosInstance} from "axios";
import {SerializedConfig} from "./types";

export interface ProjectionsPaginationOptions {
  sort?: string;
  skip?: number;
  limit?: number;
}

export interface GetSingleProjectionResponse {
  projectionId: string;
  createdAt: number;
  updatedAt: number;
  data: any;
}

export interface GetAggregatedProjectionResponse {
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

export interface DeleteProjectionDefinitionRequest {
  projectionName: string;
}

export interface GetProjectionDefinitionRequest {
  projectionName: string;
}

export interface ListSingleProjectionsResponse {
  projections: GetSingleProjectionResponse[];
  hasMore: boolean;
  totalCount: number;
}

export interface GetSingleProjectionRequest {
  projectionName: string;
  projectionId: string;
  awaitCreation?: number
}

export interface ListSingleProjectionRequest extends ProjectionsPaginationOptions {
  projectionName: string;
}

export class ProjectionsClient extends BaseClient {

  constructor(axiosClient: AxiosInstance, config: SerializedConfig) {
    super(axiosClient, config);
  }

  public async createOrUpdateDefinition(request: CreateProjectionDefinitionRequest): Promise<void> {
    return (await this.axiosClient.put(ProjectionsClient.projectionDefinitionUrl(request.projectionName), request, this.axiosConfig())).data;
  }

  public async deleteProjectionDefinition(request: DeleteProjectionDefinitionRequest): Promise<void> {
    return (await this.axiosClient.delete(ProjectionsClient.projectionDefinitionUrl(request.projectionName), this.axiosConfig())).data;
  }

  public async getProjectionDefinition(request: GetProjectionDefinitionRequest): Promise<LoadProjectionDefinitionResponse> {
    return (await this.axiosClient.get(ProjectionsClient.projectionDefinitionUrl(request.projectionName), this.axiosConfig())).data;
  }

  public async getSingleProjection(request: GetSingleProjectionRequest): Promise<GetSingleProjectionResponse> {
    const config = this.axiosConfig();
    config.params = {
      awaitCreation: request.awaitCreation,
    }
    return (await this.axiosClient.get(ProjectionsClient.singleProjectionUrl(request.projectionName, request.projectionId), config)).data;
  }

  public async listSingleProjections(request: ListSingleProjectionRequest): Promise<ListSingleProjectionsResponse> {
    const config = this.axiosConfig();
    config.params = {
      limit: request.limit,
      skip: request.skip,
      sort: request.sort,
    };
    return (await this.axiosClient.get(ProjectionsClient.singleProjectionsUrl(request.projectionName), config)).data;
  }

  public async getAggregatedProjection(projectionName: string): Promise<GetAggregatedProjectionResponse> {
    return (await this.axiosClient.get(`/projections/aggregated/${projectionName}`, this.axiosConfig())).data;
  }

  public async recreateSingleProjections(projectionName: string): Promise<void> {
    return (await this.axiosClient.delete(`/projections/single/${projectionName}`, this.axiosConfig())).data;
  }

  public async recreateAggregatedProjection(projectionName: string): Promise<void> {
    return (await this.axiosClient.delete(`/projections/aggregated/${projectionName}`, this.axiosConfig())).data;
  }

  public static projectionDefinitionUrl(projectionName: string) {
    return `/projections/definitions/${projectionName}`
  }

  public static singleProjectionUrl(projectionName: string, projectionId: string) {
    return `/projections/single/${projectionName}/${projectionId}`
  }

  public static singleProjectionsUrl(projectionName: string) {
    return `/projections/single/${projectionName}`;
  }

}
