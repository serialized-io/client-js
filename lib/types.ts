interface SerializedConfig {

  readonly accessKey: string;
  readonly secretAccessKey: string;
  readonly client?: {
    baseUrl?: string;
  };

}

export {SerializedConfig}
