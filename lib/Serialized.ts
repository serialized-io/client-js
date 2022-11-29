import {
  AggregatesClient,
  AggregatesClientConfig,
  FeedsClient,
  ProjectionsClient,
  ReactionsClient,
  SerializedConfig,
  TenantClient
} from "./";
import {v4 as uuidv4} from 'uuid';

export class DomainEvent<E> {

  public readonly eventId = uuidv4();
  public readonly eventType: string;
  public readonly data: E;
  public readonly encryptedData?: string;

  constructor(eventData: E, encryptedData?: string) {
    this.eventType = eventData.constructor.name;
    this.data = eventData;
    this.encryptedData = encryptedData
  }

  static create<E>(eventData: E, encryptedData?: string) {
    return new DomainEvent<E>(eventData, encryptedData)
  }
}

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

  public aggregateClient(aggregateType, aggregateClientConfig?: AggregatesClientConfig): AggregatesClient {
    return new AggregatesClient(aggregateType, this.serializedConfig, aggregateClientConfig);
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
