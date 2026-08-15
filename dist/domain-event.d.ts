import { Serializable } from "@nivinjoseph/n-util";
import { AggregateState } from "./aggregate-state.js";
import { DomainEventData } from "./domain-event-data.js";
import { AggregateRoot } from "./aggregate-root.js";
import { DomainContext } from "./domain-context.js";
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
export declare abstract class DomainEvent<T extends AggregateState> extends Serializable<DomainEventData> {
    private _aggregateId;
    private _id;
    private _userId;
    private readonly _name;
    private readonly _occurredAt;
    private _version;
    private readonly _isCreatedEvent;
    private _frozenDefaultState;
    /** @throws "accessing property before apply" until the event has been applied to an aggregate. */
    get aggregateId(): string;
    /**
     * Unique event identifier of the form `aggregateId-version`.
     * @throws "accessing property before apply" until the event has been applied to an aggregate.
     */
    get id(): string;
    /** @throws "accessing property before apply" until the event has been applied to an aggregate. */
    get userId(): string;
    get name(): string;
    get partitionKey(): string;
    get refId(): string;
    /**
     * The aggregate's type name (n-eda compatibility; implement it even if you don't use n-eda).
     * Return a string literal — never `Aggregate.getTypeName()`, which requires importing the
     * aggregate and creates a fatal circular dependency. Typically implemented once on an abstract
     * per-aggregate event base class.
     */
    abstract get refType(): string;
    get occurredAt(): number;
    get version(): number;
    get isCreatedEvent(): boolean;
    constructor(data: DomainEventData);
    /**
     * Framework-internal, called by `AggregateRoot` — do not call directly. Stamps
     * `userId`/`version`/`id`, overlays a created event's `$frozenDefaultState`, invokes
     * `applyEvent`, and updates `createdAt`/`updatedAt`.
     * @throws ApplicationException if the created event did not set the aggregate's id, or if the
     * event's `aggregateId`/`id` do not match the aggregate it is being applied to.
     */
    apply(aggregate: AggregateRoot<T, DomainEvent<T>>, domainContext: DomainContext, state: T): void;
    serialize(): DomainEventData;
    /**
     * Event-specific state mutation — implement your changes to `state` here. A created event
     * must set `state.id`.
     */
    protected abstract applyEvent(state: T): void;
}
//# sourceMappingURL=domain-event.d.ts.map