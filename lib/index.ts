import axios from "axios";
import {SerializedInstance} from "./Serialized";
import {SerializedConfig} from "./types";

export * from "./types";
export * from "./Serialized";
export * from "./ProjectionsClient";
export * from "./ReactionsClient";
export * from "./FeedsClient";

const SERIALIZED_ACCESS_KEY_HEADER = 'Serialized-Access-Key';
const SERIALIZED_SECRET_ACCESS_KEY_HEADER = 'Serialized-Secret-Access-Key';

export class Serialized {
  static create(config: SerializedConfig): SerializedInstance {
    if (!config) {
      const accessKey = process.env.SERIALIZED_ACCESS_KEY;
      const secretAccessKey = process.env.SERIALIZED_SECRET_ACCESS_KEY;

      if (!accessKey || !secretAccessKey) {
        console.error('Environment variable SERIALIZED_ACCESS_KEY or SERIALIZED_SECRET_ACCESS_KEY is undefined.')
        process.exit(1);
      }
      return Serialized.createInstance({accessKey, secretAccessKey});
    } else {
      return Serialized.createInstance(config)
    }
  }

  static createInstance(config: SerializedConfig): SerializedInstance {
    var axiosClient = axios.create({
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

    return new SerializedInstance(config, axiosClient);
  }
}
