import { AggregateState } from "./aggregate-state";
import { given } from "@nivinjoseph/n-defensive";
import { SerializedDomainEvent } from "./serialized-domain-event";
import "@nivinjoseph/n-ext";

// public
export abstract class DomainEvent<T extends AggregateState>
{
    private readonly _user: string; // who
    private readonly _name: string; // what
    private readonly _occurredAt: number; // when
    private _version: number;


    public get user(): string { return this._user; }
    public get name(): string { return this._name; }
    public get occurredAt(): number { return this._occurredAt; }
    public get version(): number { return this._version; }

    // occurredAt is epoch milliseconds
    public constructor(user: string, occurredAt: number, version: number)
    {
        given(user, "user").ensureHasValue().ensureIsString();
        this._user = user;
        
        this._name = (<Object>this).getTypeName();

        given(occurredAt, "occurredAt").ensureHasValue().ensureIsNumber().ensure(t => t > 0);
        this._occurredAt = occurredAt;

        given(version, "version").ensureIsNumber().ensure(t => t >= 0);
        this._version = version;
    }


    public apply(state: T): void
    {
        given(state, "state").ensureHasValue().ensureIsObject();

        this._version = state.version || 0; // the version of the state before the application of the event => becomes the version of the event

        this.applyEvent(state as T);

        state.version = this._version + 1;
    }

    public serialize(): SerializedDomainEvent
    {
        return Object.assign(this.serializeEvent(), {
            $user: this._user,
            $name: this._name,
            $occurredAt: this._occurredAt,
            $version: this._version
        });
    }


    protected abstract serializeEvent(): object;
    protected abstract applyEvent(state: T): void;
}