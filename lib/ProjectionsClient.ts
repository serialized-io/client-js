import {BaseClient} from "./";
import {isSerializedApiError, ProjectionDefinitionNotFound, ProjectionNotFound, UnauthorizedError} from "./error";

export type ProjectionSort =
    'projectionId' | 'reference' | 'createdAt' | 'updatedAt'
    | '-projectionId' | '-reference' | '-createdAt' | '-updatedAt'
    | '+projectionId' | '+reference' | '+createdAt' | '+updatedAt'

export enum ProjectionType {
  SINGLE = 'SINGLE',
  AGGREGATED = 'AGGREGATED'
}

export type GetSingleProjectionResponse = {
  readonly projectionId: string;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly data: any;
}

export type DeleteProjectionsRequest = {
  readonly projectionType: ProjectionType;
  readonly projectionName: string;
  readonly tenantId?: string;
}

export type GetAggregatedProjectionResponse = {
  readonly projectionId: string;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly data: any;
}

export type GetAggregatedProjectionRequest = {
  readonly projectionName: string;
}

export type CustomProjectionHandler = {
  readonly eventType: string;
  readonly feedName?: string;
  readonly functionUri: string;
}

export type JsonPathFunction = {
  readonly function: string;
  readonly targetSelector?: string;
  readonly eventSelector?: string;
  readonly targetFilter?: string;
  readonly eventFilter?: string;
  readonly rawData?: any;
}

export type JsonPathHandler = {
  readonly eventType: string;
  readonly feedName?: string;

  readonly idField?: string;
  readonly functions: JsonPathFunction[];
}

export type LoadProjectionDefinitionResponse = {
  readonly projectionName: string;
  readonly feedName: string,
  readonly description?: string;
  readonly handlers: CustomProjectionHandler[] | JsonPathHandler[];
}

export type CreateProjectionDefinitionRequest = {
  readonly projectionName: string;
  readonly feedName?: string;
  readonly description?: string;
  readonly handlers: CustomProjectionHandler[] | JsonPathHandler[];
  readonly indexedFields?: string[];
  readonly aggregated?: boolean;
  readonly idField?: string;
  readonly signingSecret?: string;
}

export type DeleteProjectionDefinitionRequest = {
  readonly projectionName: string;
}

export type GetProjectionDefinitionRequest = {
  readonly projectionName: string;
}

export type ListSingleProjectionsResponse = {
  readonly projections: GetSingleProjectionResponse[];
  readonly hasMore: boolean;
  readonly totalCount: number;
}

export type GetSingleProjectionRequest = {
  readonly projectionName: string;
  readonly projectionId: string;
  readonly tenantId?: string;
  readonly awaitCreation?: number
}

export type ListSingleProjectionRequest = {
  readonly projectionName: string;
  readonly reference?: string;
  readonly from?: string;
  readonly to?: string;
  readonly tenantId?: string;
  readonly sort?: ProjectionSort;
  readonly skip?: number;
  readonly limit?: number;
  readonly ids?: string[];
  readonly search?: string;
}

export type CountSingleProjectionRequest = {
  readonly projectionName: string;
  readonly tenantId?: string;
}

export type CountSingleProjectionResponse = {
  readonly count: number;
}


export const isUnauthorizedError = (error: any): error is UnauthorizedError => {
  return (error as UnauthorizedError).name === 'UnauthorizedError';
}

export class ProjectionsClient extends BaseClient {

  public async createDefinition(request: CreateProjectionDefinitionRequest): Promise<void> {
    const url = ProjectionsClient.projectionDefinitionsUrl();
    try {
      await this.axiosClient.post(url, request, this.axiosConfig());
    } catch (e) {
      throw this.handleAxiosError(e, request)
    }
  }

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

  public async getSingleProjection(request: GetSingleProjectionRequest): Promise<GetSingleProjectionResponse> {
    const url = ProjectionsClient.singleProjectionUrl(request.projectionName, request.projectionId);
    try {
      let config = this.axiosConfig();
      const params = new URLSearchParams();
      if (request.tenantId !== undefined) {
        config = this.axiosConfig(request.tenantId!)
      }
      if (request.awaitCreation !== undefined) {
        params.set('awaitCreation', String(request.awaitCreation))
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

  public async delete(request: DeleteProjectionsRequest): Promise<void> {
    let url;
    if (request.projectionType == ProjectionType.SINGLE) {
      url = ProjectionsClient.singleProjectionsUrl(request.projectionName);
    } else {
      url = ProjectionsClient.aggregatedProjectionUrl(request.projectionName);
    }
    try {
      const config = request && request.tenantId ? this.axiosConfig(request.tenantId!) : this.axiosConfig();
      config.params = new URLSearchParams();
      await this.axiosClient.delete(url, config)
    } catch (error) {
      throw this.handleApiError(error, request)
    }
  }

  public async listSingleProjections(request: ListSingleProjectionRequest): Promise<ListSingleProjectionsResponse> {
    const url = ProjectionsClient.singleProjectionsUrl(request.projectionName);
    try {
      let config = this.axiosConfig();
      const params = new URLSearchParams();
      if (request.tenantId !== undefined) {
        config = this.axiosConfig(request.tenantId!);
      }
      if (request.limit !== undefined) {
        params.set('limit', request.limit.toString())
      }
      if (request.reference !== undefined) {
        params.set('reference', request.reference)
      }
      if (request.from !== undefined) {
        params.set('from', request.from)
      }
      if (request.to !== undefined) {
        params.set('to', request.to)
      }
      if (request.skip !== undefined) {
        params.set('skip', request.skip.toString())
      }
      if (request.sort !== undefined) {
        params.set('sort', request.sort)
      }
      if (request.ids !== undefined) {
        request.ids.forEach((id) => {
          params.append('id', id)
        })
      }
      if (request.search !== undefined) {
        params.set('search', request.search)
      }
      config.params = params;
      return (await this.axiosClient.get(url, config)).data
    } catch (error) {
      throw this.handleApiError(error, request)
    }
  }

  public async countSingleProjections(request: CountSingleProjectionRequest): Promise<number> {
    const url = ProjectionsClient.singleProjectionsCountUrl(request.projectionName);
    try {
      const config = request.tenantId ? this.axiosConfig(request.tenantId!) : this.axiosConfig();
      const data = (await this.axiosClient.get(url, config)).data as CountSingleProjectionResponse;
      return data.count;
    } catch (error) {
      throw this.handleApiError(error, request)
    }
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

  public static projectionDefinitionsUrl() {
    return `/projections/definitions`
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
