import {SerializedInstance} from "./Serialized";
import {SerializedConfig} from "./types";

export * from "./types";
export * from "./Serialized";
export * from "./BaseClient";
export * from "./StateBuilder";
export * from "./AggregatesClient";
export * from "./ProjectionsClient";
export * from "./ReactionsClient";
export * from "./FeedsClient";
export * from "./TenantClient";


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
    return new SerializedInstance(config);
  }
}
