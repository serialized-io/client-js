import {
  AggregatesClient,
  AggregatesClientConfig,
  FeedsClient,
  ProjectionsClient,
  ReactionsClient,
  SerializedConfig,
  StateBuilder,
  TenantClient
} from "./";

export class SerializedInstance {
  constructor(public readonly serializedConfig: SerializedConfig) {
    if (!serializedConfig) {
      throw "No configuration given to client"
    }
    this.validateConfiguration();
  }

  public validateConfiguration() {
    if (!this.serializedConfig.accessKey) {
      throw "accessKey is missing in client configuration"
    }
    if (!this.serializedConfig.secretAccessKey) {
      throw "accessKey is missing in client configuration"
    }
  }

  public aggregateClient<A, S, T extends string, E extends { eventType: string }>(config: AggregatesClientConfig<T>, stateBuilder: StateBuilder<S, E>, aggregateFactory: (state: S) => A) {
    return new AggregatesClient<A, S, T, E>(this.serializedConfig, config, stateBuilder, aggregateFactory);
  }

  public projectionsClient(): ProjectionsClient {
    return new ProjectionsClient(this.serializedConfig);
  }

  public feedsClient(): FeedsClient {
    return new FeedsClient(this.serializedConfig);
  }

  public reactionsClient(): ReactionsClient {
    return new ReactionsClient(this.serializedConfig);
  }

  public tenantClient(): TenantClient {
    return new TenantClient(this.serializedConfig);
  }

}
