import {DomainEvent, LoadAggregateResponse} from "./AggregatesClient";

const isFunction = value => value && (Object.prototype.toString.call(value) === "[object Function]" || "function" === typeof value || value instanceof Function);

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

    response.events.map((e) => {
      let handlerName = 'handle' + e.eventType;
      let handler = this[handlerName];
      if (!(!handler && !isFunction(handler))) {
        this[handlerName](e);
      } else {
        console.log(`No handler for ${handlerName}, will defer to generic handle() method`)
        let genericHandler = this['handle'];
        if (!(!genericHandler && !isFunction(genericHandler))) {
          this['handle'](e);
        } else {
          throw Error(`No handler available for event type: ${e.eventType}`);
        }
      }

    });
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
