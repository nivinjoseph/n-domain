import { AggregateState } from "./aggregate-state";
import { given } from "@nivinjoseph/n-defensive";
import { DomainEventData } from "./domain-event-data";
import "@nivinjoseph/n-ext";
import { DomainHelper, AggregateRoot } from ".";
import { DomainContext } from "./domain-context";
import { ApplicationException } from "@nivinjoseph/n-exception";

// public
export abstract class DomainEvent<T extends AggregateState>
{
    private _aggregateId: string | null;
    private readonly _id: string;
    private _user: string | null; // who
    private readonly _name: string; // what
    private readonly _occurredAt: number; // when
    private _version: number;
    private readonly _isCreatedEvent: boolean;


    public get aggregateId(): string | null { return this._aggregateId; }
    public get id(): string { return this._id; }
    public get user(): string | null { return this._user; }
    public get name(): string { return this._name; }
    public get occurredAt(): number { return this._occurredAt; }
    public get version(): number { return this._version; }
    public get isCreatedEvent(): boolean { return this._isCreatedEvent; }

    // occurredAt is epoch milliseconds
    // public constructor(user: string, occurredAt: number = DomainHelper.now, version: number = 0)
    public constructor(data: DomainEventData)
    {
        given(data, "data").ensureHasValue()
            .ensureHasStructure({
                "$aggregateId?": "string",
                "$id?": "string",
                "$user?": "string",
                "$name?": "string",
                "$occurredAt?": "number",
                "$version?": "number",
                "$isCreatedEvent?": "boolean"
            });

        this._aggregateId = data.$aggregateId || null;
        this._id = data.$id || DomainHelper.generateId();
        this._user = data.$user && !data.$user.isEmptyOrWhiteSpace() ? data.$user.trim() : null;
        this._name = (<Object>this).getTypeName();
        this._occurredAt = data.$occurredAt || DomainHelper.now;
        this._version = data.$version || 0;
        this._isCreatedEvent = !!data.$isCreatedEvent;
    }


    public apply(aggregate: AggregateRoot<T>, domainContext: DomainContext, state: T): void
    {
        given(aggregate, "aggregate").ensureHasValue().ensureIsObject().ensure(t => t instanceof AggregateRoot);
        given(domainContext, "domainContext").ensureHasValue().ensureHasStructure({ user: "string" });
        given(state, "state").ensureHasValue().ensureIsObject();

        if (this._user == null)
            this._user = domainContext.user;
        
        this._version = state.version || 0; // the version of the state before the application of the event => becomes the version of the event

        this.applyEvent(state as T);

        if (this._aggregateId != null && this._aggregateId !== aggregate.id)
            throw new ApplicationException(`Event of type '${this._name}' with id ${this._id} and aggregateId '${this._aggregateId}' is being applied on Aggregate of type '${(<Object>aggregate).getTypeName()}' with id '${aggregate.id}'`);

        this._aggregateId = aggregate.id;
        state.version = this._version + 1;
    }

    public serialize(): DomainEventData
    {
        return Object.assign(this.serializeEvent(), {
            $aggregateId: this._aggregateId,
            $id: this._id,
            $user: this._user,
            $name: this._name,
            $occurredAt: this._occurredAt,
            $version: this._version,
            $isCreatedEvent: this._isCreatedEvent
        });
    }


    protected abstract serializeEvent(): object;
    protected abstract applyEvent(state: T): void;
}