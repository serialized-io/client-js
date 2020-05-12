export class AggregateRoot {

  private uncommittedEvents: any[];
  private currentVersion: number;

  constructor(public readonly aggregateId: string, public readonly aggregateType: string) {
    this.uncommittedEvents = [];
    this.currentVersion = 0;
    this.aggregateId = aggregateId;
    this.aggregateType = aggregateType;
  }

  saveEvents(events) {
    events.forEach((e) => this.uncommittedEvents.push(e));
  }

  fromEvents(response) {
    this.uncommittedEvents = [];
    this.currentVersion = response.aggregateVersion;
    response.events.map((e) => this['handle' + e.eventType](e));
  }

  getUncommittedEvents() {
    return this.uncommittedEvents;
  }

  commit() {
    this.uncommittedEvents = [];
  }

  nextVersion() {
    this.currentVersion = this.currentVersion + 1;
  }

  getCurrentVersion() {
    return this.currentVersion;
  }
}
