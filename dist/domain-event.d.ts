import { AggregateState } from "./aggregate-state";
import { DomainEventData } from "./domain-event-data";
import "@nivinjoseph/n-ext";
import { AggregateRoot } from ".";
import { DomainContext } from "./domain-context";
export declare abstract class DomainEvent<T extends AggregateState> {
    private _aggregateId;
    private readonly _id;
    private _user;
    private readonly _name;
    private readonly _occurredAt;
    private _version;
    private readonly _isCreatedEvent;
    readonly aggregateId: string | null;
    readonly id: string;
    readonly user: string | null;
    readonly name: string;
    readonly occurredAt: number;
    readonly version: number;
    readonly isCreatedEvent: boolean;
    constructor(data: DomainEventData);
    apply(aggregate: AggregateRoot<T>, domainContext: DomainContext, state: T): void;
    serialize(): DomainEventData;
    protected abstract serializeEvent(): object;
    protected abstract applyEvent(state: T): void;
}
