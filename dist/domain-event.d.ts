import { AggregateState } from "./aggregate-state";
import { SerializedDomainEvent } from "./serialized-domain-event";
import "@nivinjoseph/n-ext";
export declare abstract class DomainEvent<T extends AggregateState> {
    private readonly _name;
    private readonly _occurredAt;
    private _version;
    readonly name: string;
    readonly occurredAt: number;
    readonly version: number;
    constructor(occurredAt: number, version: number);
    apply(state: T): void;
    serialize(): SerializedDomainEvent;
    protected abstract serializeEvent(): object;
    protected abstract applyEvent(state: T): void;
}
