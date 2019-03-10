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
    private _id: string | null; // _aggregateId-_version
    private _userId: string | null; // who
    private readonly _name: string; // what
    private readonly _occurredAt: number; // when
    private _version: number;
    private readonly _isCreatedEvent: boolean;


    public get aggregateId(): string | null { return this._aggregateId; }
    public get id(): string { return this._id as string; }
    public get userId(): string | null { return this._userId; }
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
                "$userId?": "string",
                "$name?": "string",
                "$occurredAt?": "number",
                "$version?": "number",
                "$isCreatedEvent?": "boolean"
            });

        this._aggregateId = data.$aggregateId || null;
        this._id = data.$id || null;
        this._userId = data.$userId && !data.$userId.isEmptyOrWhiteSpace() ? data.$userId.trim() : null;
        this._name = (<Object>this).getTypeName();
        if (data.$name && data.$name !== this._name)
            throw new ApplicationException(`Deserialized event name '${data.$name}' does not match target type name '${this._name}'.`);
        this._occurredAt = data.$occurredAt || DomainHelper.now;
        this._version = data.$version || 0;
        this._isCreatedEvent = !!data.$isCreatedEvent;
    }


    public apply(aggregate: AggregateRoot<T>, domainContext: DomainContext, state: T): void
    {
        given(aggregate, "aggregate").ensureHasValue().ensureIsObject().ensure(t => t instanceof AggregateRoot);
        given(domainContext, "domainContext").ensureHasValue().ensureHasStructure({ userId: "string" });
        given(state, "state").ensureHasValue().ensureIsObject();

        if (this._userId == null)
            this._userId = domainContext.userId;
        
        const version = this._version || (state.version + 1) || 1;
        
        this.applyEvent(state as T);
        
        if (this._isCreatedEvent)
            state.createdAt = this._occurredAt;
        
        state.updatedAt = this._occurredAt;
        
        if (aggregate.id == null)
            throw new ApplicationException("Created event is not setting the id of the aggregate");

        if (this._aggregateId != null && this._aggregateId !== aggregate.id)
            throw new ApplicationException(`Event of type '${this._name}' with id ${this._id} and aggregateId '${this._aggregateId}' is being applied on Aggregate of type '${(<Object>aggregate).getTypeName()}' with id '${aggregate.id}'`);
        this._aggregateId = aggregate.id;
        
        state.version = this._version = version;
        
        const id = `${this._aggregateId}-${this._version}`;
        if (this._id != null && this._id !== id)
            throw new ApplicationException(`Deserialized id '${this._id}' does not match computed id ${id}`);
        this._id = id;
    }

    public serialize(): DomainEventData
    {
        return Object.assign(this.serializeEvent(), {
            $aggregateId: this._aggregateId,
            $id: this._id,
            $userId: this._userId,
            $name: this._name,
            $occurredAt: this._occurredAt,
            $version: this._version,
            $isCreatedEvent: this._isCreatedEvent
        });
    }


    protected abstract serializeEvent(): object;
    protected abstract applyEvent(state: T): void;
}