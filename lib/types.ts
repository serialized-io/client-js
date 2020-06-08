export interface PaginationOptions {
  since?: number;
  limit?: number;
  from?: number;
  to?: number;
}

export interface SerializedConfig {
  accessKey: string;
  secretAccessKey: string;
}


export interface ProjectionState {

}

export interface CustomProjection {
  (currentState, event) : ProjectionState
}
