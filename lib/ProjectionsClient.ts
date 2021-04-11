import {BaseClient} from "./";

export interface ListSingleProjectionOptions {
  tenantId?: string;
  sort?: string;
  skip?: number;
  limit?: number;
  id?: string[];
}

export interface DeleteProjectionOptions {
  tenantId?: string;
}

export interface GetSingleProjectionResponse {
  projectionId: string;
  createdAt: number;
  updatedAt: number;
  data: any;
}

export enum ProjectionType {
  SINGLE = 'SINGLE',
  AGGREGATED = 'AGGREGATED'
}

export interface DeleteProjectionsRequest {
  projectionType: ProjectionType;
  projectionName: string;
}

export interface GetAggregatedProjectionResponse {
  projectionId: string;
  createdAt: number;
  updatedAt: number;
  data: any;
}

export interface GetAggregatedProjectionRequest {
  projectionName: string;
}

export interface RecreateAggregatedProjectionRequest {
  projectionName: string;
}

export interface CustomProjectionHandler {
  eventType: string;
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
  signingSecret?: string;
}

export interface DeleteProjectionDefinitionRequest {
  projectionName: string;
}

export interface GetProjectionDefinitionRequest {
  projectionName: string;
}

export interface RecreateSingleProjectionsRequest {
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

export interface ListSingleProjectionRequest {
  projectionName: string;
}

export interface CountSingleProjectionRequest {
  projectionName: string;
}

export interface CountSingleProjectionOptions {
  tenantId?: string;
}

export interface CountSingleProjectionResponse {
  count: number;
}

export class ProjectionsClient extends BaseClient {

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

  public async getAggregatedProjection(request: GetAggregatedProjectionRequest): Promise<GetAggregatedProjectionResponse> {
    return (await this.axiosClient.get(ProjectionsClient.aggregatedProjectionUrl(request.projectionName), this.axiosConfig())).data;
  }

  public async deleteProjections(request: DeleteProjectionsRequest, options?: DeleteProjectionOptions): Promise<void> {
    const config = options && options.tenantId ? this.axiosConfig(options.tenantId!) : this.axiosConfig();
    config.params = new URLSearchParams();
    if (request.projectionType == ProjectionType.SINGLE) {
      await this.axiosClient.delete(ProjectionsClient.singleProjectionsUrl(request.projectionName), config);
    } else {
      await this.axiosClient.delete(ProjectionsClient.aggregatedProjectionUrl(request.projectionName), config);
    }
  }

  public async listSingleProjections(request: ListSingleProjectionRequest, options?: ListSingleProjectionOptions): Promise<ListSingleProjectionsResponse> {
    const config = options && options.tenantId ? this.axiosConfig(options.tenantId!) : this.axiosConfig();
    const params = new URLSearchParams();
    if (options.limit) {
      params.set('limit', options.limit.toString())
    }
    if (options.skip) {
      params.set('skip', options.skip.toString())
    }
    if (options.sort) {
      params.set('sort', options.sort)
    }
    if (options.id) {
      options.id.forEach((id) => {
        params.append('id', id)
      })
    }
    config.params = params;
    return (await this.axiosClient.get(ProjectionsClient.singleProjectionsUrl(request.projectionName), config)).data;
  }

  public async countSingleProjections(request: CountSingleProjectionRequest, options?: CountSingleProjectionOptions): Promise<CountSingleProjectionResponse> {
    const config = options && options.tenantId ? this.axiosConfig(options.tenantId!) : this.axiosConfig();
    config.params = new URLSearchParams();
    return (await this.axiosClient.get(ProjectionsClient.singleProjectionsCountUrl(request.projectionName), config)).data.count;
  }

  public async recreateSingleProjections(request: RecreateSingleProjectionsRequest, options?: DeleteProjectionOptions): Promise<void> {
    await this.deleteProjections({
      projectionType: ProjectionType.SINGLE,
      projectionName: request.projectionName
    }, options)
  }

  public async recreateAggregatedProjection(request: RecreateAggregatedProjectionRequest, options?: DeleteProjectionOptions): Promise<void> {
    await this.deleteProjections({
      projectionType: ProjectionType.AGGREGATED,
      projectionName: request.projectionName
    }, options)
  }

  public static projectionDefinitionUrl(projectionName: string) {
    return `/projections/definitions/${projectionName}`
  }

  public static singleProjectionUrl(projectionName: string, projectionId: string) {
    return `/projections/single/${projectionName}/${projectionId}`
  }

  public static aggregatedProjectionUrl(projectionName: string) {
    return `/projections/aggregated/${projectionName}`
  }

  public static singleProjectionsUrl(projectionName: string) {
    return `/projections/single/${projectionName}`;
  }

  public static singleProjectionsCountUrl(projectionName: string) {
    return `/projections/single/${projectionName}/_count`;
  }

}
