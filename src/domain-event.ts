import { given } from "@nivinjoseph/n-defensive";
import { ApplicationException } from "@nivinjoseph/n-exception";
import { Serializable, serialize } from "@nivinjoseph/n-util";
import { AggregateState } from "./aggregate-state.js";
import { DomainEventData } from "./domain-event-data.js";
import { DomainHelper } from "./domain-helper.js";
import { AggregateRoot } from "./aggregate-root.js";
import { DomainContext } from "./domain-context.js";


// public
export abstract class DomainEvent<T extends AggregateState> extends Serializable<DomainEventData>
{
    private _aggregateId: string | null;
    private _id: string | null; // _aggregateId-_version
    private _userId: string | null; // who
    private readonly _name: string; // what
    private readonly _occurredAt: number; // when
    private _version: number;
    private readonly _isCreatedEvent: boolean;
    private _organizationId: string | null;


    @serialize("$aggregateId")
    public get aggregateId(): string
    {
        given(this, "this").ensure(t => t._aggregateId != null, "accessing property before apply");

        return this._aggregateId as string;
    }

    @serialize("$id")
    public get id(): string
    {
        given(this, "this").ensure(t => t._id != null, "accessing property before apply");

        return this._id as string;
    }

    @serialize("$userId")
    public get userId(): string
    {
        given(this, "this").ensure(t => t._userId != null, "accessing property before apply");

        return this._userId as string;
    }

    @serialize("$name")
    public get name(): string { return this._name; }

    public get partitionKey(): string { return this.aggregateId; } // n-eda compatibility

    public get refId(): string { return this.aggregateId; } // n-eda compatibility

    public abstract get refType(): string; // n-eda compatibility

    @serialize("$occurredAt")
    public get occurredAt(): number { return this._occurredAt; }

    @serialize("$version")
    public get version(): number { return this._version; }

    @serialize("$isCreatedEvent")
    public get isCreatedEvent(): boolean { return this._isCreatedEvent; }
    
    @serialize("$organizationId")
    public get organizationId(): string
    {
        given(this, "this").ensure(t => t._organizationId != null, "accessing property before apply");

        return this._organizationId!;
    }

    // occurredAt is epoch milliseconds
    public constructor(data: DomainEventData)
    {
        super(data);

        const {
            $aggregateId,
            $id,
            $userId,
            $name,
            $occurredAt,
            $version,
            $isCreatedEvent,
            $organizationId
        } = data;

        given($aggregateId as string, "$aggregateId").ensureIsString();
        this._aggregateId = $aggregateId || null;

        given($id as string, "$id").ensureIsString();
        this._id = $id || null;

        given($userId as string, "$userId").ensureIsString();
        this._userId = $userId && !$userId.isEmptyOrWhiteSpace() ? $userId.trim() : null;

        this._name = (<Object>this).getTypeName();
        if ($name && $name !== this._name)
            throw new ApplicationException(`Deserialized event name '${$name}' does not match target type name '${this._name}'.`);

        given($occurredAt as number, "$occurredAt").ensureIsNumber();
        this._occurredAt = $occurredAt || DomainHelper.now;

        given($version as number, "$version").ensureIsNumber().ensure(t => t > 0);
        this._version = $version || 0;

        given($isCreatedEvent as boolean, "$isCreatedEvent").ensureIsBoolean();
        this._isCreatedEvent = !!$isCreatedEvent;
        
        given($organizationId as string, "$organizationId").ensureIsString();
        this._organizationId = $organizationId && !$organizationId.isEmptyOrWhiteSpace() ? $organizationId.trim() : null;
    }


    public apply(aggregate: AggregateRoot<T, DomainEvent<T>>, domainContext: DomainContext, state: T): void
    {
        given(aggregate, "aggregate").ensureHasValue().ensureIsObject().ensure(t => t instanceof AggregateRoot);
        given(domainContext, "domainContext").ensureHasValue().ensureHasStructure({
            userId: "string",
            organizationId: "string"
        });
        given(state, "state").ensureHasValue().ensureIsObject();

        if (this._userId == null)
            this._userId = domainContext.userId || "UNKNOWN";
        
        if (this._organizationId == null)
            this._organizationId = domainContext.organizationId || "UNKNOWN";

        const version = this._version || (state.version + 1) || 1;

        this.applyEvent(state);

        if (this._isCreatedEvent)
            state.createdAt = this._occurredAt;

        state.updatedAt = this._occurredAt;

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (aggregate.id == null)
            throw new ApplicationException("Created event did not set the id of the aggregate");
        
        if (this._organizationId !== state.organizationId)
            throw new ApplicationException(`${this.name} organizationId '${this._organizationId}' does not match state organizationId '${state.organizationId}'`);

        if (this._aggregateId != null && this._aggregateId !== aggregate.id)
            throw new ApplicationException(`Event of type '${this._name}' with id ${this._id} and aggregateId '${this._aggregateId}' is being applied on Aggregate of type '${(<Object>aggregate).getTypeName()}' with id '${aggregate.id}'`);
        this._aggregateId = aggregate.id;

        state.version = this._version = version;

        const id = `${this._aggregateId}-${this._version}`;
        if (this._id != null && this._id !== id)
            throw new ApplicationException(`Deserialized id '${this._id}' does not match computed id ${id}`);
        this._id = id;
    }

    // public serialize(): DomainEventData
    // {
    //     return Object.assign(this.serializeEvent(), {
    //         $aggregateId: this._aggregateId,
    //         $id: this._id,
    //         $userId: this._userId,
    //         $name: this._name,
    //         $occurredAt: this._occurredAt,
    //         $version: this._version,
    //         $isCreatedEvent: this.,
    //         $organizationId: this._organizationId
    //     } as any);
    // }


    // protected abstract serializeEvent(): object;
    protected abstract applyEvent(state: T): void;
}