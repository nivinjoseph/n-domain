import { given } from "@nivinjoseph/n-defensive";
import { ApplicationException } from "@nivinjoseph/n-exception";
import { Serializable, serialize } from "@nivinjoseph/n-util";
import { AggregateState } from "./aggregate-state.js";
import { AggregateStateHelper } from "./aggregate-state-helper.js";
import { DomainEventData } from "./domain-event-data.js";
import { DomainHelper } from "./domain-helper.js";
import { AggregateRoot } from "./aggregate-root.js";
import { DomainContext } from "./domain-context.js";


// public
/**
 * Base class for domain events — the only mechanism through which aggregate state changes.
 *
 * Contracts the type system cannot express:
 * - Decorate every concrete event class with `@serialize("YourNamespace")` (and each payload
 *   getter with `@serialize`), or replay/deserialization fails at runtime.
 * - The event **class name is the persisted identity** (`$name`); renaming an event class breaks
 *   deserialization of already-stored streams.
 * - A created event's constructor must set `data.$isCreatedEvent = true` **before** calling
 *   `super(data)`, and its `applyEvent` must set `state.id`.
 * - Implement `refType` with a string literal of the aggregate's type name; importing the
 *   aggregate class to call `Aggregate.getTypeName()` creates a fatal circular dependency.
 * - `aggregateId`, `id`, and `userId` are populated by `apply()`; accessing them earlier throws.
 *
 * @typeParam T - the aggregate state this event mutates
 */
export abstract class DomainEvent<T extends AggregateState> extends Serializable<DomainEventData>
{
    private _aggregateId: string | null;
    private _id: string | null; // _aggregateId-_version
    private _userId: string | null; // who
    private readonly _name: string; // what
    private readonly _occurredAt: number; // when
    private _version: number;
    private readonly _isCreatedEvent: boolean;
    // serialized create() defaults (base fields stripped); created events only. set on deserialize via the
    // constructor, and on the new-aggregate path by the AggregateRoot constructor through an `any` cast (the
    // same idiom used for _aggregateId), so this stamping stays off DomainEvent's public surface — hence not readonly.
    // eslint-disable-next-line @typescript-eslint/prefer-readonly
    private _frozenDefaultState: object | null;


    /** @throws "accessing property before apply" until the event has been applied to an aggregate. */
    @serialize("$aggregateId")
    public get aggregateId(): string
    {
        given(this, "this").ensure(t => t._aggregateId != null, "accessing property before apply");

        return this._aggregateId as string;
    }

    /**
     * Unique event identifier of the form `aggregateId-version`.
     * @throws "accessing property before apply" until the event has been applied to an aggregate.
     */
    @serialize("$id")
    public get id(): string
    {
        given(this, "this").ensure(t => t._id != null, "accessing property before apply");

        return this._id as string;
    }

    /** @throws "accessing property before apply" until the event has been applied to an aggregate. */
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

    /**
     * The aggregate's type name (n-eda compatibility; implement it even if you don't use n-eda).
     * Return a string literal — never `Aggregate.getTypeName()`, which requires importing the
     * aggregate and creates a fatal circular dependency. Typically implemented once on an abstract
     * per-aggregate event base class.
     */
    public abstract get refType(): string; // n-eda compatibility

    @serialize("$occurredAt")
    public get occurredAt(): number { return this._occurredAt; }

    @serialize("$version")
    public get version(): number { return this._version; }

    @serialize("$isCreatedEvent")
    public get isCreatedEvent(): boolean { return this._isCreatedEvent; }

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
            $frozenDefaultState
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

        given($frozenDefaultState as object, "$frozenDefaultState").ensureIsObject();
        this._frozenDefaultState = $frozenDefaultState ?? null;
    }


    /**
     * Framework-internal, called by `AggregateRoot` — do not call directly. Stamps
     * `userId`/`version`/`id`, overlays a created event's `$frozenDefaultState`, invokes
     * `applyEvent`, and updates `createdAt`/`updatedAt`.
     * @throws ApplicationException if the created event did not set the aggregate's id, or if the
     * event's `aggregateId`/`id` do not match the aggregate it is being applied to.
     */
    public apply(aggregate: AggregateRoot<T, DomainEvent<T>>, domainContext: DomainContext, state: T): void
    {
        given(aggregate, "aggregate").ensureHasValue().ensureIsObject().ensure(t => t instanceof AggregateRoot);
        given(domainContext, "domainContext").ensureHasValue().ensureHasStructure({ userId: "string" });
        given(state, "state").ensureHasValue().ensureIsObject();

        if (this._userId == null)
            this._userId = domainContext.userId || "UNKNOWN";

        const version = this._version || (state.version + 1) || 1;

        // a created event carrying frozen default state overlays the historical create() defaults
        // (base fields stripped) onto the current-code base before its own applyEvent sets real values.
        // this isolates replay from future create() default changes for fields no event writes.
        if (this._isCreatedEvent && this._frozenDefaultState != null)
            Object.assign(state, AggregateStateHelper.deserializeSnapshotIntoState(this._frozenDefaultState));

        this.applyEvent(state);

        if (this._isCreatedEvent)
            state.createdAt = this._occurredAt;

        state.updatedAt = this._occurredAt;

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (aggregate.id == null)
            throw new ApplicationException("Created event did not set the id of the aggregate");

        if (this._aggregateId != null && this._aggregateId !== aggregate.id)
            throw new ApplicationException(`Event of type '${this._name}' with id ${this._id} and aggregateId '${this._aggregateId}' is being applied on Aggregate of type '${(<Object>aggregate).getTypeName()}' with id '${aggregate.id}'`);
        this._aggregateId = aggregate.id;

        state.version = this._version = version;

        const id = `${this._aggregateId}-${this._version}`;
        if (this._id != null && this._id !== id)
            throw new ApplicationException(`Deserialized id '${this._id}' does not match computed id ${id}`);
        this._id = id;
    }

    public override serialize(): DomainEventData
    {
        const data = super.serialize();

        // only created events carry frozen default state; keep every other event's serialized shape unchanged
        if (this._isCreatedEvent && this._frozenDefaultState != null)
            data.$frozenDefaultState = this._frozenDefaultState;

        return data;
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
    //         $isCreatedEvent: this._isCreatedEvent
    //     } as any);
    // }


    // protected abstract serializeEvent(): object;
    /**
     * Event-specific state mutation — implement your changes to `state` here. A created event
     * must set `state.id`.
     */
    protected abstract applyEvent(state: T): void;
}