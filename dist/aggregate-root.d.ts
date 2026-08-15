import { Serializable } from "@nivinjoseph/n-util";
import { AggregateRootData } from "./aggregate-root-data.js";
import { AggregateStateFactory } from "./aggregate-state-factory.js";
import { AggregateState } from "./aggregate-state.js";
import { DomainContext } from "./domain-context.js";
import { DomainEventData } from "./domain-event-data.js";
import { DomainEvent } from "./domain-event.js";
/**
 * Base class for event-sourced aggregate roots.
 *
 * Lifecycle: an aggregate is born from exactly one "created event" (`$isCreatedEvent`), which gets
 * the state factory's pristine `create()` defaults frozen into it so future replays are isolated
 * from later default changes. Events already persisted are "retro" events; events applied in the
 * current session are "current" events (the unit of work to persist). Rehydrate via
 * `AggregateFactory` / `deserializeFromEvents` (full replay) or `deserializeFromSnapshot`.
 *
 * Subclasses must preserve the exact positional constructor signature
 * `(domainContext, events, stateFactory, currentState?)` — `AggregateFactory`, `clone`,
 * `constructVersion`, and `constructBefore` instantiate the subclass positionally with these
 * arguments. Decorate the subclass with `@serialize("YourNamespace")`.
 *
 * Note: several methods (`clone`, `constructVersion`, `constructBefore`, `hasEventOfType`,
 * `hasRetroEventOfType`, `getEventsOfType`, `getRetroEventsOfType`) require retro events and throw
 * on a freshly created, not-yet-persisted aggregate; the `*CurrentEvent*` variants are always safe.
 *
 * @typeParam T - the aggregate's state interface
 * @typeParam TDomainEvent - the aggregate's (abstract) domain event base type
 */
export declare abstract class AggregateRoot<T extends AggregateState, TDomainEvent extends DomainEvent<T>> extends Serializable<AggregateRootData> {
    private readonly _domainContext;
    private readonly _stateFactory;
    private readonly _state;
    private readonly _retroEvents;
    private readonly _retroVersion;
    private readonly _currentEvents;
    private readonly _isNew;
    private _isReconstructed;
    private _reconstructedFromVersion;
    protected get state(): T;
    get context(): DomainContext;
    get id(): string;
    get retroEvents(): ReadonlyArray<DomainEvent<T>>;
    get retroVersion(): number;
    get currentEvents(): ReadonlyArray<DomainEvent<T>>;
    get currentVersion(): number;
    get events(): ReadonlyArray<DomainEvent<T>>;
    get version(): number;
    get createdAt(): number;
    get updatedAt(): number;
    get isNew(): boolean;
    get hasChanges(): boolean;
    get isReconstructed(): boolean;
    get reconstructedFromVersion(): number;
    get isRebased(): boolean;
    get rebasedFromVersion(): number;
    /**
     * Prefer instantiating through `AggregateFactory` or the static deserialize methods.
     *
     * Pass either events (replay path) or a snapshot `currentState` — when the snapshot carries a
     * version, `events` must be empty. The events must contain exactly one created event. Loaded
     * state is run through the factory's `update()` and must come out at the current `typeVersion`.
     *
     * @throws if events are combined with a versioned snapshot, if the created-event count is not
     * exactly one, or if `update()` leaves loaded state at a stale `typeVersion`.
     */
    constructor(domainContext: DomainContext, events: ReadonlyArray<DomainEvent<T>>, stateFactory: AggregateStateFactory<T>, currentState?: T);
    /**
     * Rehydrates an aggregate by deserializing stored event data (via the `@serialize` registry)
     * and replaying the full stream. Every event type must be decorated with
     * `@serialize("Namespace")` or deserialization fails.
     */
    static deserializeFromEvents<TAggregate extends AggregateRoot<TAggregateState, TAggregateDomainEvent>, TAggregateState extends AggregateState, TAggregateDomainEvent extends DomainEvent<TAggregateState>>(domainContext: DomainContext, aggregateType: new (...args: Array<any>) => TAggregate, stateFactory: AggregateStateFactory<TAggregateState>, eventData: ReadonlyArray<DomainEventData>): TAggregate;
    /**
     * Rehydrates an aggregate from a state snapshot (produced by `snapshot()`) without replaying
     * events; `retroEvents` will be empty, so the event-inspection and reconstruction methods that
     * require retro events are unavailable on the result.
     */
    static deserializeFromSnapshot<TAggregate extends AggregateRoot<TAggregateState, TAggregateDomainEvent>, TAggregateState extends AggregateState, TAggregateDomainEvent extends DomainEvent<TAggregateState>>(domainContext: DomainContext, aggregateType: new (...args: Array<any>) => TAggregate, stateFactory: AggregateStateFactory<TAggregateState>, stateSnapshot: TAggregateState): TAggregate;
    /**
     * Serializes current state into a plain snapshot object; nested `Serializable`s (DomainObjects)
     * are serialized, while keys named in `cloneKeys` are deep-cloned via JSON instead. State
     * fields must be primitives, arrays, plain JSON objects, or `Serializable`/`DomainObject`
     * instances — any other object with private (`_`-prefixed) fields throws at snapshot time.
     */
    snapshot(...cloneKeys: ReadonlyArray<string>): T | object;
    /**
     * Reconstructs the aggregate as of `version` by replaying only the events up to it.
     * @throws if `version` is out of range, or when called on an aggregate without retro events
     * (freshly created or snapshot-loaded).
     */
    constructVersion(version: number): this;
    /**
     * Reconstructs the aggregate as of just before `dateTime` (epoch ms) by replaying only the
     * events that occurred earlier.
     * @throws if `dateTime` is not after `createdAt`, or when called on an aggregate without retro
     * events (freshly created or snapshot-loaded).
     */
    constructBefore(dateTime: number): this;
    /**
     * Checks all events (retro + current) for an event of the given type.
     * @throws when called on an aggregate without retro events (freshly created or
     * snapshot-loaded); use `hasCurrentEventOfType` there instead.
     */
    hasEventOfType<TEventType extends DomainEvent<T>>(eventType: new (...args: Array<any>) => TEventType): boolean;
    /**
     * Checks the persisted (retro) events for an event of the given type.
     * @throws when called on an aggregate without retro events (freshly created or snapshot-loaded).
     */
    hasRetroEventOfType<TEventType extends DomainEvent<T>>(eventType: new (...args: Array<any>) => TEventType): boolean;
    /**
     * Checks the uncommitted (current) events for an event of the given type. Safe on any
     * aggregate, including freshly created ones.
     */
    hasCurrentEventOfType<TEventType extends DomainEvent<T>>(eventType: new (...args: Array<any>) => TEventType): boolean;
    /**
     * Returns all events (retro + current) of the given type.
     * @throws when called on an aggregate without retro events (freshly created or
     * snapshot-loaded); use `getCurrentEventsOfType` there instead.
     */
    getEventsOfType<TEventType extends DomainEvent<T>>(eventType: new (...args: Array<any>) => TEventType): Array<TEventType>;
    /**
     * Returns the persisted (retro) events of the given type.
     * @throws when called on an aggregate without retro events (freshly created or snapshot-loaded).
     */
    getRetroEventsOfType<TEventType extends DomainEvent<T>>(eventType: new (...args: Array<any>) => TEventType): Array<TEventType>;
    /**
     * Returns the uncommitted (current) events of the given type. Safe on any aggregate,
     * including freshly created ones.
     */
    getCurrentEventsOfType<TEventType extends DomainEvent<T>>(eventType: new (...args: Array<any>) => TEventType): Array<TEventType>;
    /**
     * Creates a new aggregate seeded by `createdEvent`, then replays this aggregate's non-created
     * events onto it (with their identity fields cleared so they re-apply as fresh events).
     *
     * @param createdEvent - provide a new created event to be used by the clone
     * @param serializedEventMutatorAndFilter - provide a function that can mutate the serialized event if required and returns a boolean indicating whether to include the event or not.
     * @returns - cloned Aggregate
     * @throws when called on an aggregate without retro events (freshly created or snapshot-loaded).
     */
    clone(createdEvent: DomainEvent<T>, serializedEventMutatorAndFilter?: (event: {
        $name: string;
    }) => boolean): this;
    /**
     * Self-check that serialization, event replay, and snapshot round-trips all reproduce
     * identical state, and that the state factory's `create()` is deterministic. Intended to be
     * called from your test suite.
     */
    test(): void;
    /**
     * Collapses history up to `version` into a single rebase event produced by
     * `rebasedEventFactoryFunc`. Protected — override with a public method on your aggregate that
     * supplies your own rebased event type.
     *
     * The produced event's `applyEvent` must forward its three payload values to
     * `AggregateStateHelper.rebaseState(state, defaultState, rebaseState, rebaseVersion)`;
     * without that call the rebase event has no effect on state.
     */
    protected rebase(version: number, rebasedEventFactoryFunc: (defaultState: object, rebaseState: object, rebaseVersion: number) => TDomainEvent): void;
    /**
     * Applies a new (current/uncommitted) event to the aggregate; call this from your aggregate's
     * behavior methods.
     * @throws if the event is a created event and the aggregate already has events.
     */
    protected applyEvent(event: TDomainEvent): void;
}
//# sourceMappingURL=aggregate-root.d.ts.map