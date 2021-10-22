import {AggregatesClient, FeedsClient, ProjectionsClient, ReactionsClient, SerializedConfig, TenantClient} from "./";
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
  constructor(public readonly config: SerializedConfig) {
    if (!config) {
      throw "No configuration given to client"
    }
    this.validateConfiguration();
  }

  public validateConfiguration() {
    if (!this.config.accessKey) {
      throw "accessKey is missing in client configuration"
    }
    if (!this.config.secretAccessKey) {
      throw "accessKey is missing in client configuration"
    }
  }

  public aggregateClient<A>(type): AggregatesClient<A> {
    return new AggregatesClient<A>(type, this.config);
  }

  public projectionsClient(): ProjectionsClient {
    return new ProjectionsClient(this.config);
  }

  public feedsClient(): FeedsClient {
    return new FeedsClient(this.config);
  }

  public reactionsClient(): ReactionsClient {
    return new ReactionsClient(this.config);
  }

  public tenantClient(): TenantClient {
    return new TenantClient(this.config);
  }

}
