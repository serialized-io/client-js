export const isProjectionNotFound = (error: any): error is ProjectionNotFound => {
  return (error as ProjectionNotFound).name === 'ProjectionNotFound';
}

/**
 * Type guard to check if the thrown error is a SerializedError
 */
export const isSerializedError = (error: any): error is SerializedError => {
  return (error as SerializedError).isSerializedError === true;
}

/**
 * Type guard to check if the thrown error is an ApiError
 */
export const isSerializedApiError = (error: any): error is ApiError => {
  return (error as ApiError).name === 'ApiError';
}

/**
 * Base type for all errors thrown by the Serialized client
 */
export abstract class SerializedError extends Error {

  public readonly isSerializedError: boolean;

  protected constructor(public readonly name, message?: string) {
    super(message);
    this.isSerializedError = true;
  }

}

/**
 * Thrown if an unexpected error occurs in the client
 */
export class UnexpectedClientError extends SerializedError {
  constructor(private error: Error) {
    super('UnexpectedClientError');
  }
}

/**
 * Thrown when calling projection definition endpoints for a projection definition that does not exist.
 */
export class ProjectionDefinitionNotFound extends SerializedError {
  constructor(public readonly projectionName: string) {
    super('ProjectionDefinitionNotFound')
  }
}

/**
 * Thrown when trying to load a projection that does not exist.
 */
export class ProjectionNotFound extends SerializedError {
  constructor(public readonly projectionName: string,
              public readonly projectionId?: string) {
    super('ProjectionNotFound')
  }
}

/**
 * Thrown when trying to load an aggregate that does not exist.
 */
export class AggregateNotFound extends SerializedError {
  constructor(public readonly aggregateType: string, public readonly aggregateId: string) {
    super('AggregateNotFound')
  }
}

/**
 * Thrown by the aggregate client when the state loading of the Aggregate fails.
 */
export class StateLoadingError extends SerializedError {
  constructor(message?: string) {
    super('StateLoadingError', message)
  }
}

/**
 * Thrown when there is a configuration error in the client setup.
 */
export class ConfigurationError extends SerializedError {
  constructor(message?: string) {
    super('ConfigurationError', message)
  }
}

/**
 * Thrown when there is a version conflict when saving an aggregate using the expectedVersion argument. Either via the create or update methods in the AggregatesClient.
 */
export class Conflict extends SerializedError {
  constructor() {
    super('Conflict')
  }
}

/**
 * Thrown when the API returns an error code. This is normally wrapped by the client classes to more use-case specific errors.
 */
export class ApiError extends SerializedError {
  constructor(public readonly statusCode: number, public readonly data?: any) {
    super('ApiError')
  }
}

/**
 * Thrown when using invalid access keys.
 */
export class UnauthorizedError extends SerializedError {
  constructor(public readonly requestUrl: string) {
    super('UnauthorizedError')
  }
}

/**
 * Thrown when you exceeded the rate limit for the current time period.
 */
export class RateLimitExceeded extends SerializedError {
  constructor(public readonly requestUrl: string) {
    super('RateLimitExceeded')
  }
}

/**
 * Thrown when the API is temporarily unavailable for some reason.
 */
export class ServiceUnavailable extends SerializedError {
  constructor(public readonly requestUrl: string) {
    super('ServiceUnavailable')
  }
}
