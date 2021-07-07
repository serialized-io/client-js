import {v4 as uuidv4} from 'uuid'

import {
  AggregateNotFound,
  Conflict,
  isAggregateNotFound,
  isConflict,
  isProjectionDefinitionNotFound,
  isProjectionNotFound,
  isRateLimitExceeded,
  isSerializedApiError,
  isSerializedError,
  isServiceUnavailable,
  isUnexpectedClientError,
  ProjectionDefinitionNotFound,
  ProjectionNotFound,
  RateLimitExceeded,
  ServiceUnavailable,
  UnauthorizedError,
  UnexpectedClientError
} from "../../lib/error";
import {isUnauthorizedError} from "../../lib";

describe('Errors', () => {

  it('ProjectionNotFound should be a 404 API error', async () => {
    const projectionName = 'some-projection';
    const err = new ProjectionNotFound(projectionName);
    expect(isProjectionNotFound(err)).toBe(true)
    expect(isSerializedApiError(err)).toBe(true)
    expect(isSerializedError(err)).toBe(true)
    expect(err.projectionName).toBe(projectionName)
    expect(err.statusCode).toBe(404)
  })

  it('ProjectionDefinitionNotFound should be a 404 API error', async () => {
    const projectionName = 'some-projection';
    const err = new ProjectionDefinitionNotFound(projectionName);
    expect(isProjectionDefinitionNotFound(err)).toBe(true)
    expect(isSerializedApiError(err)).toBe(true)
    expect(isSerializedError(err)).toBe(true)
    expect(err.projectionName).toBe(projectionName)
    expect(err.statusCode).toBe(404)
  })

  it('AggregateNotFound should be a 404 API error', async () => {
    const aggregateType = 'some-aggregate-type';
    const aggregateId = uuidv4();
    const err = new AggregateNotFound(aggregateType, aggregateId);
    expect(isAggregateNotFound(err)).toBe(true)
    expect(isSerializedApiError(err)).toBe(true)
    expect(isSerializedError(err)).toBe(true)
    expect(err.aggregateId).toBe(aggregateId)
    expect(err.aggregateType).toBe(aggregateType)
    expect(err.statusCode).toBe(404)
  })

  it('Conflict should be a 409 API error', async () => {
    const aggregateType = 'some-aggregate-type';
    const aggregateId = uuidv4();
    const err = new Conflict(aggregateType, aggregateId, 10);
    expect(isConflict(err)).toBe(true)
    expect(isSerializedApiError(err)).toBe(true)
    expect(isSerializedError(err)).toBe(true)
    expect(err.aggregateId).toBe(aggregateId)
    expect(err.aggregateType).toBe(aggregateType)
    expect(err.expectedVersion).toBe(10)
    expect(err.statusCode).toBe(409)
  })

  it('UnauthorizedError should be a 401 API error', async () => {
    const requestUrl = '/projections/single/some-projection';
    const err = new UnauthorizedError(requestUrl);
    expect(isUnauthorizedError(err)).toBe(true)
    expect(isSerializedApiError(err)).toBe(true)
    expect(isSerializedError(err)).toBe(true)
    expect(err.requestUrl).toBe(requestUrl)
    expect(err.statusCode).toBe(401)
  })

  it('RateLimitExceeded should be a 429 API error', async () => {
    const err = new RateLimitExceeded();
    expect(isRateLimitExceeded(err)).toBe(true)
    expect(isSerializedApiError(err)).toBe(true)
    expect(isSerializedError(err)).toBe(true)
    expect(err.statusCode).toBe(429)
  })

  it('ServiceUnavailable should be a 503 API error', async () => {
    const requestUrl = 'https://api.serialized.io/projections/single/some-projection'
    const err = new ServiceUnavailable(requestUrl);
    expect(isServiceUnavailable(err)).toBe(true)
    expect(isSerializedApiError(err)).toBe(true)
    expect(isSerializedError(err)).toBe(true)
    expect(err.statusCode).toBe(503)
  })

  it('UnexpectedClientError should contain cause', async () => {
    const cause = new Error('Some internal unexpected error');
    const err = new UnexpectedClientError(cause);
    expect(isSerializedError(err)).toBe(true)
    expect(isUnexpectedClientError(err)).toBe(true)
    expect(err.cause).toBe(cause)
  })


});
