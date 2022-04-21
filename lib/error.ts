/**
 * Type guard to check if the thrown error is a SerializedError
 */
export const isSerializedError = (error: any): error is SerializedError => {
  return (error as SerializedError).isSerializedError === true;
}

/**
 * Base type for all errors thrown by the Serialized client
 */
export abstract class SerializedError extends Error {

  public readonly isSerializedError: boolean;

  protected constructor(message?: string) {
    super(message);
    this.isSerializedError = true;
  }

}

/**
 * Type guard to check if the thrown error is a SerializedApiError
 */
export const isSerializedApiError = (error: any): error is SerializedApiError => {
  return (error as SerializedApiError).isSerializedApiError === true;
}

/**
 * Thrown when the API returns an error code. This is normally wrapped by the client classes to more use-case specific errors.
 */
export class SerializedApiError extends SerializedError {
  public isSerializedApiError: boolean;

  constructor(public readonly statusCode: number, public readonly data?: any) {
    super()
    this.isSerializedApiError = true
  }
}

/**
 * Type guard to check if the thrown error is an UnexpectedClientError
 */
export const isUnexpectedClientError = (error: any): error is UnexpectedClientError => {
  return (error as UnexpectedClientError).name === UnexpectedClientError.name;
}

/**
 * Thrown if an unexpected error occurs in the client
 */
export class UnexpectedClientError extends SerializedError {
  constructor(public cause: Error) {
    super();
    this.name = 'UnexpectedClientError'
  }
}

/**
 * Type guard to check if the thrown error is a ProjectionNotFound
 */
export const isProjectionDefinitionNotFound = (error: any): error is ProjectionDefinitionNotFound => {
  return (error as ProjectionDefinitionNotFound).name === 'ProjectionDefinitionNotFound';
}

/**
 * Thrown when calling projection definition endpoints for a projection definition that does not exist.
 */
export class ProjectionDefinitionNotFound extends SerializedApiError {
  constructor(public readonly projectionName: string) {
    super(404)
    this.name = 'ProjectionDefinitionNotFound'
  }
}

/**
 * Type guard to check if the thrown error is a ProjectionNotFound
 */
export const isProjectionNotFound = (error: any): error is ProjectionNotFound => {
  return (error as ProjectionNotFound).name === 'ProjectionNotFound';
}

/**
 * Thrown when trying to load a projection that does not exist.
 */
export class ProjectionNotFound extends SerializedApiError {
  constructor(public readonly projectionName: string,
              public readonly projectionId?: string) {
    super(404)
    this.name = 'ProjectionNotFound'
  }
}

/**
 * Type guard to check if the thrown error is a AggregateNotFound
 */
export const isAggregateNotFound = (error: any): error is AggregateNotFound => {
  return (error as AggregateNotFound).name === AggregateNotFound.name;
}

/**
 * Thrown when trying to load an aggregate that does not exist.
 */
export class AggregateNotFound extends SerializedApiError {
  constructor(public readonly aggregateType: string, public readonly aggregateId: string) {
    super(404)
    this.name = AggregateNotFound.name
  }
}

/**
 * Type guard to check if the thrown error is a StateLoadingError
 */
export const isStateLoadingError = (error: any): error is StateLoadingError => {
  return (error as StateLoadingError).name === 'StateLoadingError'
}

/**
 * Thrown by the aggregate client when the state loading of the Aggregate fails.
 */
export class StateLoadingError extends SerializedError {
  constructor(message?: string) {
    super(message)
    this.name = 'StateLoadingError'
  }
}

/**
 * Type guard to check if the thrown error is a ProjectionNotFound
 */
export const isConfigurationError = (error: any): error is ConfigurationError => {
  return (error as ConfigurationError).name === 'ConfigurationError';
}

/**
 * Thrown when there is a configuration error in the client setup.
 */
export class ConfigurationError extends SerializedError {
  constructor(message?: string) {
    super(message)
    this.name = 'ConfigurationError'
  }
}

/**
 * Type guard to check if the thrown error is a ProjectionNotFound
 */
export const isConflict = (error: any): error is Conflict => {
  return (error as Conflict).name === 'Conflict';
}

/**
 * Thrown when there is a version conflict when saving an aggregate using the expectedVersion argument. Either via the create or update methods in the AggregatesClient.
 */
export class Conflict extends SerializedApiError {
  constructor(public readonly aggregateType: string,
              public readonly aggregateId: string) {
    super(409)
    this.name = 'Conflict'
  }
}

/**
 * Type guard to check if the thrown error is a UnauthorizedError
 */
export const isUnauthorizedError = (error: any): error is UnauthorizedError => {
  return (error as UnauthorizedError).name === 'UnauthorizedError';
}

/**
 * Thrown when using invalid access keys.
 */
export class UnauthorizedError extends SerializedApiError {
  constructor(public readonly requestUrl: string) {
    super(401)
    this.name = 'UnauthorizedError'
  }
}

/**
 * Type guard to check if the thrown error is a RateLimitExceeded
 */
export const isRateLimitExceeded = (error: any): error is RateLimitExceeded => {
  return (error as RateLimitExceeded).name === 'RateLimitExceeded';
}

/**
 * Thrown when you exceeded the rate limit for the current time period.
 */
export class RateLimitExceeded extends SerializedApiError {
  constructor() {
    super(429)
    this.name = 'RateLimitExceeded'
  }
}

/**
 * Type guard to check if the thrown error is a ServiceUnavailable
 */
export const isServiceUnavailable = (error: any): error is ServiceUnavailable => {
  return (error as ServiceUnavailable).name === 'ServiceUnavailable';
}

/**
 * Thrown when the API is temporarily unavailable for some reason.
 */
export class ServiceUnavailable extends SerializedApiError {
  constructor(public readonly requestUrl) {
    super(503);
    this.name = 'ServiceUnavailable'
  }
}
