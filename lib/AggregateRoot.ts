import {DomainEvent, LoadAggregateResponse} from "./AggregateClient";

export class AggregateRoot {

  private uncommittedEvents: any[];
  private currentVersion: number;

  constructor(public readonly aggregateId: string, public readonly aggregateType: string) {
    this.uncommittedEvents = [];
    this.currentVersion = 0;
    this.aggregateId = aggregateId;
    this.aggregateType = aggregateType;
  }

  saveEvents(events: DomainEvent[]): void {
    events.forEach((e) => this.uncommittedEvents.push(e));
  }

  fromEvents(response: LoadAggregateResponse): void {
    this.uncommittedEvents = [];
    this.currentVersion = response.aggregateVersion;
    response.events.map((e) => this['handle' + e.eventType](e));
  }

  getUncommittedEvents(): DomainEvent[] {
    return this.uncommittedEvents;
  }

  commit(): void {
    this.uncommittedEvents = [];
  }

  nextVersion(): void {
    this.currentVersion = this.currentVersion + 1;
  }

  getCurrentVersion(): number {
    return this.currentVersion;
  }
}
