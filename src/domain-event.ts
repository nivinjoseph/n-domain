import { AggregateState } from "./aggregate-state";
import { given } from "@nivinjoseph/n-defensive";
import { SerializedDomainEvent } from "./serialized-domain-event";

// public
export abstract class DomainEvent<T extends AggregateState>
{
    private readonly _name: string;
    private readonly _occurredAt: number;
    private _version: number;


    public get name(): string { return this._name; }
    public get occurredAt(): number { return this._occurredAt; }
    public get version(): number { return this._version; }

    // occurredAt is epoch milliseconds
    public constructor(occurredAt: number, version: number)
    {
        this._name = (<Object>this).getTypeName();

        given(occurredAt, "occurredAt").ensureHasValue().ensureIsNumber().ensure(t => t > 0);
        this._occurredAt = occurredAt;

        given(version, "version").ensureIsNumber().ensure(t => t >= 0);
        this._version = version;
    }


    public apply(state: AggregateState): void
    {
        given(state, "state").ensureHasValue().ensureIsObject();

        this._version = state.version || 0; // the version of the state before the application of the event => becomes the version of the event

        this.applyEvent(state as T);

        state.version = this._version + 1;
    }

    public serialize(): SerializedDomainEvent
    {
        return Object.assign(this.serializeEvent(), {
            $name: this._name,
            $occurredAt: this._occurredAt,
            $version: this._version
        });
    }


    protected abstract serializeEvent(): object;
    protected abstract applyEvent(state: T): void;
}