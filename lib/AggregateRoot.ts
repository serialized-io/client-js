import {DomainEvent, LoadAggregateResponse} from "./AggregateClient";

export class AggregateRoot {

  private uncommittedEvents: any[];
  private currentVersion: number;

  public constructor(public readonly aggregateId: string, public readonly aggregateType: string) {
    this.uncommittedEvents = [];
    this.currentVersion = 0;
    this.aggregateId = aggregateId;
    this.aggregateType = aggregateType;
  }

  public saveEvents(events: DomainEvent[]): void {
    events.forEach((e) => this.uncommittedEvents.push(e));
  }

  public fromEvents(response: LoadAggregateResponse): void {
    this.uncommittedEvents = [];
    this.currentVersion = response.aggregateVersion;
    response.events.map((e) => this['handle' + e.eventType](e));
  }

  public getUncommittedEvents(): DomainEvent[] {
    return this.uncommittedEvents;
  }

  public commit(): void {
    this.uncommittedEvents = [];
  }

  public nextVersion(): void {
    this.currentVersion = this.currentVersion + 1;
  }

  public getCurrentVersion(): number {
    return this.currentVersion;
  }
}
