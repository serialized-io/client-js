import {AxiosInstance, AxiosRequestConfig} from "axios";
import {SerializedConfig} from "./types";

export class BaseClient {

  public readonly axiosClient: AxiosInstance;
  private config: SerializedConfig;

  constructor(axiosClient, config) {
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
