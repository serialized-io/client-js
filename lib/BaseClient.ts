import axios, {AxiosInstance, AxiosRequestConfig} from "axios";
import {SerializedConfig} from "./types";

const SERIALIZED_ACCESS_KEY_HEADER = 'Serialized-Access-Key';
const SERIALIZED_SECRET_ACCESS_KEY_HEADER = 'Serialized-Secret-Access-Key';

export class BaseClient {

  public readonly axiosClient: AxiosInstance;
  private config: SerializedConfig;

  constructor(config) {
    const axiosClient = axios.create({
      baseURL: `https://api.serialized.io`,
      withCredentials: true,
      maxRedirects: 0,
      headers: {
        Accept: 'application/json',
      }
    });

    axiosClient.interceptors.response.use((response) => {
      return response;
    }, error => {
      if (error.config.headers[SERIALIZED_ACCESS_KEY_HEADER]) {
        error.config.headers[SERIALIZED_ACCESS_KEY_HEADER] = '******'
      }
      if (error.config.headers[SERIALIZED_SECRET_ACCESS_KEY_HEADER]) {
        error.config.headers[SERIALIZED_SECRET_ACCESS_KEY_HEADER] = '******'
      }
      return Promise.reject(error);
    });
    this.axiosClient = axiosClient;
    this.config = config;
  }

  protected axiosConfig(): AxiosRequestConfig {
    return {
      headers: {
        'Serialized-Access-Key': this.config.accessKey,
        'Serialized-Secret-Access-Key': this.config.secretAccessKey,
      }
    }
  }


}
