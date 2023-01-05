import axios, {AxiosInstance, AxiosRequestConfig} from "axios";
import {SerializedConfig} from "./";
import {
  InvalidPayloadError,
  RateLimitExceeded,
  SerializedApiError,
  ServiceUnavailable,
  UnauthorizedError
} from "./error";

const SERIALIZED_ACCESS_KEY_HEADER = 'Serialized-Access-Key';
const SERIALIZED_SECRET_ACCESS_KEY_HEADER = 'Serialized-Secret-Access-Key';

export class BaseClient {

  public readonly axiosClient: AxiosInstance;
  private config: SerializedConfig;

  constructor(config: SerializedConfig) {
    const axiosClient = axios.create({
      baseURL: `https://api.serialized.io`,
      withCredentials: true,
      maxRedirects: 0,
      headers: {
        Accept: 'application/json',
        'Serialized-Access-Key': config.accessKey,
        'Serialized-Secret-Access-Key': config.secretAccessKey
      }
    });

    axiosClient.interceptors.response.use((response) => {
      return response;
    }, error => {
      if (error.config && error.config.headers) {
        if (error.config.headers[SERIALIZED_ACCESS_KEY_HEADER]) {
          error.config.headers[SERIALIZED_ACCESS_KEY_HEADER] = '******'
        }
        if (error.config.headers[SERIALIZED_SECRET_ACCESS_KEY_HEADER]) {
          error.config.headers[SERIALIZED_SECRET_ACCESS_KEY_HEADER] = '******'
        }
      }
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 401) {
          return Promise.reject(new UnauthorizedError(error.config.url))
        } else if (error.response.status === 422) {
          return Promise.reject(new InvalidPayloadError(error))
        } else if (error.response.status === 429) {
          return Promise.reject(new RateLimitExceeded())
        } else if (error.response.status === 503) {
          return Promise.reject(new ServiceUnavailable(error.config.url))
        } else {
          return Promise.reject(new SerializedApiError(error.response.status, error.response.data))
        }
      } else {
        return Promise.reject(error)
      }
    });
    this.axiosClient = axiosClient;
    this.config = config;
  }

  protected axiosConfig(tenantId?: string): AxiosRequestConfig {
    let additionalHeaders = {}
    if (tenantId) {
      additionalHeaders = {'Serialized-Tenant-Id': tenantId}
    }
    return {
      headers: {...additionalHeaders}
    }
  }

}
