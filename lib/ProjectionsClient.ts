import {BaseClient} from "./";
import {isSerializedApiError, ProjectionDefinitionNotFound, ProjectionNotFound, UnauthorizedError} from "./error";

export type ProjectionSort =
    'projectionId' | 'reference' | 'createdAt' | 'updatedAt'
    | '-projectionId' | '-reference' | '-createdAt' | '-updatedAt'
    | '+projectionId' | '+reference' | '+createdAt' | '+updatedAt'

export interface ListSingleProjectionOptions {
  reference?: string;
  tenantId?: string;
  sort?: ProjectionSort;
  skip?: number;
  limit?: number;
  id?: string[];
}

export interface DeleteProjectionOptions {
  tenantId?: string;
}

export interface GetSingleProjectionOptions {
  tenantId?: string;
  awaitCreation?: number
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
  rawData?: any;
}

export interface JsonPathHandler {
  eventType: string;
  functions: JsonPathFunction[];
}

export interface LoadProjectionDefinitionResponse {
  projectionName: string;
  feedName: string,
  description?: string;
  handlers: CustomProjectionHandler[] | JsonPathHandler[];
}

export interface CreateProjectionDefinitionRequest {
  projectionName: string;
  feedName: string;
  description?: string;
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


export const isUnauthorizedError = (error: any): error is UnauthorizedError => {
  return (error as UnauthorizedError).name === 'UnauthorizedError';
}

export class ProjectionsClient extends BaseClient {

  public async createOrUpdateDefinition(request: CreateProjectionDefinitionRequest): Promise<void> {
    const url = ProjectionsClient.projectionDefinitionUrl(request.projectionName);
    try {
      await this.axiosClient.put(url, request, this.axiosConfig());
    } catch (e) {
      throw this.handleAxiosError(e, request)
    }
  }

  public async deleteProjectionDefinition(request: DeleteProjectionDefinitionRequest): Promise<void> {
    const url = ProjectionsClient.projectionDefinitionUrl(request.projectionName);
    try {
      await this.axiosClient.delete(url, this.axiosConfig());
    } catch (e) {
      throw this.handleAxiosError(e, request)
    }
  }

  public async getProjectionDefinition(request: GetProjectionDefinitionRequest): Promise<LoadProjectionDefinitionResponse> {
    const url = ProjectionsClient.projectionDefinitionUrl(request.projectionName);
    try {
      return (await this.axiosClient.get(url, this.axiosConfig())).data;
    } catch (e) {
      throw this.handleAxiosError(e, request)
    }
  }

  public async getSingleProjection(request: GetSingleProjectionRequest, options?: GetSingleProjectionOptions): Promise<GetSingleProjectionResponse> {
    const url = ProjectionsClient.singleProjectionUrl(request.projectionName, request.projectionId);
    try {
      let config = this.axiosConfig();
      const params = new URLSearchParams();
      if (options) {
        if (options.tenantId !== undefined) {
          config = this.axiosConfig(options.tenantId!)
        }
        if (options.awaitCreation !== undefined) {
          params.set('awaitCreation', String(options.awaitCreation))
        }
      }
      config.params = params;
      return (await this.axiosClient.get(url, config)).data;
    } catch (error) {
      throw this.handleApiError(error, request);
    }
  }

  public async getAggregatedProjection(request: GetAggregatedProjectionRequest): Promise<GetAggregatedProjectionResponse> {
    const url = ProjectionsClient.aggregatedProjectionUrl(request.projectionName);
    try {
      return (await this.axiosClient.get(url, this.axiosConfig())).data
    } catch (error) {
      throw this.handleApiError(error, request);
    }
  }

  public async deleteProjections(request: DeleteProjectionsRequest, options?: DeleteProjectionOptions): Promise<void> {
    let url;
    if (request.projectionType == ProjectionType.SINGLE) {
      url = ProjectionsClient.singleProjectionsUrl(request.projectionName);
    } else {
      url = ProjectionsClient.aggregatedProjectionUrl(request.projectionName);
    }
    try {
      const config = options && options.tenantId ? this.axiosConfig(options.tenantId!) : this.axiosConfig();
      config.params = new URLSearchParams();
      await this.axiosClient.delete(url, config)
    } catch (error) {
      throw this.handleApiError(error, request)
    }
  }

  public async listSingleProjections(request: ListSingleProjectionRequest, options?: ListSingleProjectionOptions): Promise<ListSingleProjectionsResponse> {
    const url = ProjectionsClient.singleProjectionsUrl(request.projectionName);
    try {
      let config = this.axiosConfig();
      const params = new URLSearchParams();
      if (options) {
        if (options.tenantId !== undefined) {
          config = this.axiosConfig(options.tenantId!);
        }
        if (options.limit !== undefined) {
          params.set('limit', options.limit.toString())
        }
        if (options.reference !== undefined) {
          params.set('reference', options.reference)
        }
        if (options.skip !== undefined) {
          params.set('skip', options.skip.toString())
        }
        if (options.sort !== undefined) {
          params.set('sort', options.sort)
        }
        if (options.id !== undefined) {
          options.id.forEach((id) => {
            params.append('id', id)
          })
        }
      }
      config.params = params;
      return (await this.axiosClient.get(url, config)).data
    } catch (error) {
      throw this.handleApiError(error, request)
    }
  }

  public async countSingleProjections(request: CountSingleProjectionRequest, options?: CountSingleProjectionOptions): Promise<number> {
    const url = ProjectionsClient.singleProjectionsCountUrl(request.projectionName);
    try {
      const config = options && options.tenantId ? this.axiosConfig(options.tenantId!) : this.axiosConfig();
      const data = (await this.axiosClient.get(url, config)).data as CountSingleProjectionResponse;
      return data.count;
    } catch (error) {
      throw this.handleApiError(error, request)
    }
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

  private handleApiError(err: Error, request: any) {
    if (isSerializedApiError(err)) {
      if (err.statusCode === 404) {
        return new ProjectionNotFound(request.projectionName, request.projectionId)
      }
    }
    return err;
  }

  private handleAxiosError(err: Error, request: any) {
    if (isSerializedApiError(err)) {
      if (err.statusCode === 404) {
        return new ProjectionDefinitionNotFound(request.projectionName)
      }
    }
    return err;
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
