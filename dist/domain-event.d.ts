import { AggregateState } from "./aggregate-state";
import { DomainEventData } from "./domain-event-data";
import "@nivinjoseph/n-ext";
import { DomainContext } from "./domain-context";
export declare abstract class DomainEvent<T extends AggregateState> {
    private _user;
    private readonly _name;
    private readonly _occurredAt;
    private _version;
    readonly user: string;
    readonly name: string;
    readonly occurredAt: number;
    readonly version: number;
    constructor(data: DomainEventData);
    apply(domainContext: DomainContext, state: T): void;
    serialize(): DomainEventData;
    protected abstract serializeEvent(): object;
    protected abstract applyEvent(state: T): void;
}
