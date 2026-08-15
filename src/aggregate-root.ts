import { given } from "@nivinjoseph/n-defensive";
import { Deserializer, Serializable, serialize } from "@nivinjoseph/n-util";
import { createHash } from "node:crypto";
import { AggregateRootData } from "./aggregate-root-data.js";
import { AggregateStateFactory } from "./aggregate-state-factory.js";
import { AggregateState, clearBaseState } from "./aggregate-state.js";
import { DomainContext } from "./domain-context.js";
import { DomainEventData } from "./domain-event-data.js";
import { DomainEvent } from "./domain-event.js";
// import { AggregateRebased } from "./aggregate-rebased";
import { AggregateStateHelper } from "./aggregate-state-helper.js";
import { AggregateFactory } from "./aggregate-factory.js";

// public
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
export abstract class AggregateRoot<T extends AggregateState, TDomainEvent extends DomainEvent<T>> extends Serializable<AggregateRootData>
{
    private readonly _domainContext: DomainContext;
    private readonly _stateFactory: AggregateStateFactory<T>;
    private readonly _state: T;
    private readonly _retroEvents: ReadonlyArray<DomainEvent<T>>;
    private readonly _retroVersion: number;
    private readonly _currentEvents = new Array<DomainEvent<T>>(); // track unit of work stuff
    private readonly _isNew: boolean = false;
    private _isReconstructed = false;
    private _reconstructedFromVersion = 0;


    protected get state(): T { return this._state; }


    public get context(): DomainContext { return this._domainContext; }

    @serialize("$id")
    public get id(): string { return this._state.id; }

    public get retroEvents(): ReadonlyArray<DomainEvent<T>> { return this._retroEvents.orderBy(t => t.version); }
    public get retroVersion(): number { return this._retroVersion; }

    public get currentEvents(): ReadonlyArray<DomainEvent<T>> { return this._currentEvents.orderBy(t => t.version); }
    public get currentVersion(): number { return this._state.version; }

    @serialize("$events")
    public get events(): ReadonlyArray<DomainEvent<T>> { return [...this._retroEvents, ...this._currentEvents].orderBy(t => t.version); }

    @serialize("$version")
    public get version(): number { return this.currentVersion; }

    @serialize("$createdAt")
    public get createdAt(): number { return this._state.createdAt; }

    @serialize("$updatedAt")
    public get updatedAt(): number { return this._state.updatedAt; }

    public get isNew(): boolean { return this._isNew; } // this will always be false for anything that is reconstructed
    public get hasChanges(): boolean { return this.currentVersion !== this.retroVersion; }

    public get isReconstructed(): boolean { return this._isReconstructed; }
    public get reconstructedFromVersion(): number { return this._reconstructedFromVersion; }

    public get isRebased(): boolean { return this._state.isRebased; }
    public get rebasedFromVersion(): number { return this._state.rebasedFromVersion; }


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
    public constructor(domainContext: DomainContext, events: ReadonlyArray<DomainEvent<T>>,
        stateFactory: AggregateStateFactory<T>, currentState?: T)
    {
        super({} as any);

        given(domainContext, "domainContext").ensureHasValue()
            .ensureHasStructure({ userId: "string" });
        this._domainContext = domainContext;

        given(events, "events").ensureHasValue().ensureIsArray();
        given(stateFactory, "stateFactory").ensureHasValue().ensureIsObject();
        this._stateFactory = stateFactory;

        given(currentState as object, "currentState").ensureIsObject();
        const defaultState = this._stateFactory.create();
        const currentTypeVersion = defaultState.typeVersion;
        this._state = Object.assign(defaultState, currentState);

        if (this._state.version)
        {
            given(events, "events")
                .ensure(t => t.length === 0, "no events should be passed when constructing from snapshot");
            this._retroEvents = [];
        }
        else
        {
            given(events, "events")
                .ensure(t => t.length > 0, "no events passed")
                .ensure(t => t.some(u => u.isCreatedEvent), "no created event passed")
                .ensure(t => t.count(u => u.isCreatedEvent) === 1, "more than one created event passed");
            this._retroEvents = [...events];
            if (this._retroEvents.some(t => (<any>t)._aggregateId == null)) // Deliberate workaround to access aggregateId
                this._isNew = true;
            if (this._isNew)
            {
                // freeze the pristine default state (current create() output, captured here before any event
                // mutates this._state) into the created event, with base fields stripped. on every future
                // replay this is overlaid as the base layer so fields no event writes are sourced from the
                // stream rather than from a (possibly changed) future create().
                const frozenDefaultState = AggregateStateHelper.serializeStateIntoSnapshot(this._state);
                clearBaseState(frozenDefaultState);
                const createdEvent = this._retroEvents.find(t => t.isCreatedEvent)!;
                // stamp the frozen defaults onto the created event's internal field via cast (same workaround as
                // _aggregateId above), keeping this framework detail off DomainEvent's public surface.
                given(createdEvent, "createdEvent")
                    .ensure(t => (<any>t)._frozenDefaultState == null, "created event already has frozen default state");
                (<any>createdEvent)._frozenDefaultState = frozenDefaultState;

                this._retroEvents.forEach(t => t.apply(this, this._domainContext, this._state));
            }
            else
                this._retroEvents.orderBy(t => t.version).forEach(t => t.apply(this, this._domainContext, this._state));
        }
        this._state = this._stateFactory.update(this._state);

        given(this._state, "state").ensure(
            t => t.typeVersion === currentTypeVersion,
            `loaded state has typeVersion ${this._state.typeVersion} but the current type version is ${currentTypeVersion}; `
            + "migrate it forward in the state factory's update() method (and bump state.typeVersion)");

        this._retroVersion = this.currentVersion;
    }

    /**
     * Rehydrates an aggregate by deserializing stored event data (via the `@serialize` registry)
     * and replaying the full stream. Every event type must be decorated with
     * `@serialize("Namespace")` or deserialization fails.
     */
    public static deserializeFromEvents<TAggregate extends AggregateRoot<TAggregateState, TAggregateDomainEvent>,
        TAggregateState extends AggregateState, TAggregateDomainEvent extends DomainEvent<TAggregateState>>(domainContext: DomainContext,
            aggregateType: new (...args: Array<any>) => TAggregate, stateFactory: AggregateStateFactory<TAggregateState>, eventData: ReadonlyArray<DomainEventData>): TAggregate
    {
        given(domainContext, "domainContext").ensureHasValue().ensureHasStructure({ userId: "string" });
        given(aggregateType, "aggregateType").ensureHasValue().ensureIsFunction();
        given(stateFactory, "stateFactory").ensureHasValue().ensureIsObject();
        given(eventData, "eventData").ensureHasValue().ensureIsArray().ensure(t => t.length > 0);


        // given(data, "data").ensureHasValue().ensureIsObject()
        //     .ensureHasStructure({
        //         $id: "string",
        //         $version: "number",
        //         $createdAt: "number",
        //         $updatedAt: "number",
        //         $events: [{
        //             $aggregateId: "string",
        //             $id: "string",
        //             $userId: "string",
        //             $name: "string",
        //             $occurredAt: "number",
        //             $version: "number",
        //             $isCreatedEvent: "boolean"
        //         }]
        //     });

        const deserializedEvents = eventData.map((eventData) =>
        {
            return Deserializer.deserialize<DomainEvent<any>>(eventData);

            // const name = eventData.$name;
            // const event = eventTypes.find(t => (<Object>t).getTypeName() === name);
            // if (!event)
            //     throw new ApplicationException(`No event type supplied for event with name '${name}'`);
            // if (!(<any>event).deserializeEvent)
            //     throw new ApplicationException(`Event type '${name}' does not have a static deserializeEvent method defined.`);
            // return (<any>event).deserializeEvent(eventData);
        });

        
        // return new aggregateType(domainContext, deserializedEvents);
        
        return new AggregateFactory(aggregateType, domainContext, stateFactory)
            .createFromEvents(deserializedEvents);
    }

    // public serialize(): AggregateRootData
    // {
    //     return {
    //         $id: this.id,
    //         $version: this.version,
    //         $createdAt: this.createdAt,
    //         $updatedAt: this.updatedAt,
    //         $events: this.events.map(t => t.serialize())
    //     };
    // }

    // public serialize(): AggregateRootData
    // {
    //     return super.serialize() as AggregateRootData;
    // }

    /**
     * Rehydrates an aggregate from a state snapshot (produced by `snapshot()`) without replaying
     * events; `retroEvents` will be empty, so the event-inspection and reconstruction methods that
     * require retro events are unavailable on the result.
     */
    public static deserializeFromSnapshot<TAggregate extends AggregateRoot<TAggregateState, TAggregateDomainEvent>,
        TAggregateState extends AggregateState, TAggregateDomainEvent extends DomainEvent<TAggregateState>>(domainContext: DomainContext,
            aggregateType: new (...args: Array<any>) => TAggregate, stateFactory: AggregateStateFactory<TAggregateState>,
            stateSnapshot: TAggregateState): TAggregate
    {
        given(domainContext, "domainContext").ensureHasValue().ensureHasStructure({ userId: "string" });
        given(aggregateType, "aggregateType").ensureHasValue().ensureIsFunction();
        given(stateFactory, "stateFactory").ensureHasValue().ensureIsObject();
        given(stateSnapshot, "stateSnapshot").ensureHasValue().ensureIsObject()
            .ensureHasStructure({
                id: "string",
                version: "number",
                createdAt: "number",
                updatedAt: "number"
            });

        const deserializedSnapshot = stateFactory.deserializeSnapshot(stateSnapshot);

        return new aggregateType(domainContext, [], stateFactory, deserializedSnapshot);
    }

    /**
     * Serializes current state into a plain snapshot object; nested `Serializable`s (DomainObjects)
     * are serialized, while keys named in `cloneKeys` are deep-cloned via JSON instead. State
     * fields must be primitives, arrays, plain JSON objects, or `Serializable`/`DomainObject`
     * instances — any other object with private (`_`-prefixed) fields throws at snapshot time.
     */
    public snapshot(...cloneKeys: ReadonlyArray<string>): T | object
    {
        return AggregateStateHelper.serializeStateIntoSnapshot(this.state, ...cloneKeys);
    }

    /**
     * Reconstructs the aggregate as of `version` by replaying only the events up to it.
     * @throws if `version` is out of range, or when called on an aggregate without retro events
     * (freshly created or snapshot-loaded).
     */
    public constructVersion(version: number): this
    {
        given(version, "version").ensureHasValue().ensureIsNumber()
            .ensure(t => t > 0 && t <= this.version, `version must be > 0 and <= ${this.version} (current version)`);

        given(this, "this").ensure(t => t.retroEvents.length > 0, "invoking method on object without retro events");

        // const ctor = (<Object>this).constructor;
        // // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        // const result = new (<any>ctor)(this._domainContext, this.events.filter(t => t.version <= version)) as this;
        const result = new AggregateFactory((<Object>this).constructor as any, this._domainContext, this._stateFactory)
            .createFromEvents(this.events.filter(t => t.version <= version));
        result._isReconstructed = true;
        result._reconstructedFromVersion = this.version;
        return result as this;
    }

    /**
     * Reconstructs the aggregate as of just before `dateTime` (epoch ms) by replaying only the
     * events that occurred earlier.
     * @throws if `dateTime` is not after `createdAt`, or when called on an aggregate without retro
     * events (freshly created or snapshot-loaded).
     */
    public constructBefore(dateTime: number): this
    {
        given(dateTime, "dateTime").ensureHasValue().ensureIsNumber()
            .ensure(t => t > this.createdAt, "dateTime must be after createdAt");

        given(this, "this").ensure(t => t.retroEvents.length > 0, "invoking method on object without retro events");

        // const ctor = (<Object>this).constructor;
        // // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        // const result = new (<any>ctor)(this._domainContext, this.events.filter(t => t.occurredAt < dateTime)) as this;
        const result = new AggregateFactory((<Object>this).constructor as any, this._domainContext, this._stateFactory)
            .createFromEvents(this.events.filter(t => t.occurredAt < dateTime));
        result._isReconstructed = true;
        result._reconstructedFromVersion = this.version;
        return result as this;
    }

    /**
     * Checks all events (retro + current) for an event of the given type.
     * @throws when called on an aggregate without retro events (freshly created or
     * snapshot-loaded); use `hasCurrentEventOfType` there instead.
     */
    public hasEventOfType<TEventType extends DomainEvent<T>>(eventType: new (...args: Array<any>) => TEventType): boolean
    {
        given(eventType, "eventType").ensureHasValue().ensureIsFunction();

        given(this, "this").ensure(t => t.retroEvents.length > 0, "invoking method on object without retro events");

        const eventTypeName = (<Object>eventType).getTypeName();
        return this.events.some(t => t.name === eventTypeName);
    }

    /**
     * Checks the persisted (retro) events for an event of the given type.
     * @throws when called on an aggregate without retro events (freshly created or snapshot-loaded).
     */
    public hasRetroEventOfType<TEventType extends DomainEvent<T>>(eventType: new (...args: Array<any>) => TEventType): boolean
    {
        given(eventType, "eventType").ensureHasValue().ensureIsFunction();

        given(this, "this").ensure(t => t.retroEvents.length > 0, "invoking method on object without retro events");

        const eventTypeName = (<Object>eventType).getTypeName();
        return this._retroEvents.some(t => t.name === eventTypeName);
    }

    /**
     * Checks the uncommitted (current) events for an event of the given type. Safe on any
     * aggregate, including freshly created ones.
     */
    public hasCurrentEventOfType<TEventType extends DomainEvent<T>>(eventType: new (...args: Array<any>) => TEventType): boolean
    {
        given(eventType, "eventType").ensureHasValue().ensureIsFunction();

        const eventTypeName = (<Object>eventType).getTypeName();
        return this._currentEvents.some(t => t.name === eventTypeName);
    }

    /**
     * Returns all events (retro + current) of the given type.
     * @throws when called on an aggregate without retro events (freshly created or
     * snapshot-loaded); use `getCurrentEventsOfType` there instead.
     */
    public getEventsOfType<TEventType extends DomainEvent<T>>(eventType: new (...args: Array<any>) => TEventType): Array<TEventType>
    {
        given(eventType, "eventType").ensureHasValue().ensureIsFunction();

        given(this, "this").ensure(t => t.retroEvents.length > 0, "invoking method on object without retro events");

        const eventTypeName = (<Object>eventType).getTypeName();
        return this.events.filter(t => t.name === eventTypeName) as Array<TEventType>;
    }

    /**
     * Returns the persisted (retro) events of the given type.
     * @throws when called on an aggregate without retro events (freshly created or snapshot-loaded).
     */
    public getRetroEventsOfType<TEventType extends DomainEvent<T>>(eventType: new (...args: Array<any>) => TEventType): Array<TEventType>
    {
        given(eventType, "eventType").ensureHasValue().ensureIsFunction();

        given(this, "this").ensure(t => t.retroEvents.length > 0, "invoking method on object without retro events");

        const eventTypeName = (<Object>eventType).getTypeName();
        return this._retroEvents.filter(t => t.name === eventTypeName) as Array<TEventType>;
    }

    /**
     * Returns the uncommitted (current) events of the given type. Safe on any aggregate,
     * including freshly created ones.
     */
    public getCurrentEventsOfType<TEventType extends DomainEvent<T>>(eventType: new (...args: Array<any>) => TEventType): Array<TEventType>
    {
        given(eventType, "eventType").ensureHasValue().ensureIsFunction();

        const eventTypeName = (<Object>eventType).getTypeName();
        return this._currentEvents.filter(t => t.name === eventTypeName) as Array<TEventType>;
    }

    /**
     * Creates a new aggregate seeded by `createdEvent`, then replays this aggregate's non-created
     * events onto it (with their identity fields cleared so they re-apply as fresh events).
     *
     * @param createdEvent - provide a new created event to be used by the clone
     * @param serializedEventMutatorAndFilter - provide a function that can mutate the serialized event if required and returns a boolean indicating whether to include the event or not.
     * @returns - cloned Aggregate
     * @throws when called on an aggregate without retro events (freshly created or snapshot-loaded).
     */
    public clone(createdEvent: DomainEvent<T>,
        serializedEventMutatorAndFilter?: (event: { $name: string; }) => boolean): this
    {
        given(createdEvent, "createdEvent").ensureHasValue().ensureIsInstanceOf(DomainEvent)
            .ensure(t => t.isCreatedEvent, "must be created event");

        // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
        given(serializedEventMutatorAndFilter as Function, "serializedEventMutator").ensureIsFunction();

        given(this, "this").ensure(t => t.retroEvents.length > 0, "invoking method on object without retro events");

        // // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        // const clone: this = new (<any>this.constructor)(domainContext, [createdEvent]);
        const clone = new AggregateFactory((<Object>this).constructor as any, this._domainContext, this._stateFactory)
            .createFromEvents([createdEvent]);
        

        this.events
            .where(t => !t.isCreatedEvent)
            .forEach(t =>
            {
                const serializedEvent = t.serialize();

                if (serializedEventMutatorAndFilter != null)
                {
                    const keep = serializedEventMutatorAndFilter(serializedEvent as any);
                    if (!keep)
                        return;
                }

                serializedEvent.$aggregateId = null;
                serializedEvent.$id = null;
                serializedEvent.$userId = null;
                // serializedEvent.$name = null; // we keep the name intact
                serializedEvent.$occurredAt = null;
                serializedEvent.$version = null;
                // serializedEvent.$isCreatedEvent = null; // we dont need to touch this

                clone.applyEvent(Deserializer.deserialize(serializedEvent));
            });

        return clone as this;
    }

    /**
     * Self-check that serialization, event replay, and snapshot round-trips all reproduce
     * identical state, and that the state factory's `create()` is deterministic. Intended to be
     * called from your test suite.
     */
    public test(): void
    {
        const type = (<Object>this).constructor as new (...params: Array<any>) => this;
        given(type, "type").ensureHasValue().ensureIsFunction()
            .ensure(t => (<Object>t).getTypeName() === (<Object>this).getTypeName(), "type name mismatch");


        const defaultState = this._stateFactory.create();
        given(defaultState, "defaultState").ensureHasValue().ensureIsObject()
            .ensure(t => JSON.stringify(t) === JSON.stringify(this._stateFactory.create()), "multiple default state creations are not consistent");


        // // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
        // const deserializeEvents: Function = (<any>type).deserializeEvents;
        // given(deserializeEvents, "deserializeEvents").ensureHasValue().ensureIsFunction();

        const eventsSerialized = this.serialize();
        given(eventsSerialized, "eventsSerialized").ensureHasValue().ensureIsObject()
            .ensureHasStructure({
                $id: "string",
                $version: "number",
                $createdAt: "number",
                $updatedAt: "number",
                $events: ["object"]
            })
            .ensure(t => JSON.stringify(t) === JSON.stringify(this.serialize()), "multiple serializations are not consistent");

        const eventsDeserializedAggregate: this = AggregateRoot.deserializeFromEvents(this._domainContext, type, this._stateFactory, eventsSerialized.$events);
        given(eventsDeserializedAggregate, "eventsDeserializedAggregate").ensureHasValue().ensureIsObject().ensureIsType(type);

        const eventsDeserializedAggregateState = eventsDeserializedAggregate.state;
        console.log("eventsDeserializedAggregateState", JSON.stringify(eventsDeserializedAggregateState));
        console.log("state", JSON.stringify(this.state));

        const eventsDeserializedAggregateStateHash = createHash("sha512")
            .update(JSON.stringify(eventsDeserializedAggregateState).trim())
            .digest("hex").toUpperCase();

        const originalStateHash = createHash("sha512")
            .update(JSON.stringify(this.state).trim())
            .digest("hex").toUpperCase();

        given(eventsDeserializedAggregateStateHash, "eventsDeserializedAggregateStateHash").ensureHasValue().ensureIsString()
            .ensure(t => t === originalStateHash, "state is not consistent with original state");

        // // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
        // const deserializeSnapshot: Function = (<any>type).deserializeSnapshot;
        // given(deserializeSnapshot, "deserializeSnapshot").ensureHasValue().ensureIsFunction();

        const snapshot = this.snapshot();
        given(snapshot, "snapshot").ensureHasValue().ensureIsObject()
            .ensure(t => JSON.stringify(t) === JSON.stringify(this.snapshot()), "multiple snapshots are not consistent");

        const snapshotDeserializedAggregate: this = AggregateRoot.deserializeFromSnapshot(this._domainContext, type, this._stateFactory, snapshot as AggregateState);
        given(snapshotDeserializedAggregate, "snapshotDeserializedAggregate").ensureHasValue().ensureIsObject().ensureIsType(type);

        const snapshotDeserializedAggregateState = snapshotDeserializedAggregate.state;
        given(snapshotDeserializedAggregateState, "snapshotDeserializedAggregateState").ensureHasValue().ensureIsObject()
            .ensure(t => JSON.stringify(t) === JSON.stringify(this.state), "state is not consistent with original state");
    }

    /**
     * Collapses history up to `version` into a single rebase event produced by
     * `rebasedEventFactoryFunc`. Protected — override with a public method on your aggregate that
     * supplies your own rebased event type.
     *
     * The produced event's `applyEvent` must forward its three payload values to
     * `AggregateStateHelper.rebaseState(state, defaultState, rebaseState, rebaseVersion)`;
     * without that call the rebase event has no effect on state.
     */
    protected rebase(version: number, rebasedEventFactoryFunc: (defaultState: object, rebaseState: object, rebaseVersion: number) => TDomainEvent): void
    {
        given(version, "version").ensureHasValue().ensureIsNumber()
            .ensure(t => t > 0 && t <= this.version, `version must be > 0 and <= ${this.version} (current version)`);

        given(rebasedEventFactoryFunc, "rebasedEventFactoryFunc").ensureHasValue().ensureIsFunction();

        const rebaseVersionInstance = this.constructVersion(version);
        given(rebaseVersionInstance, "rebaseVersionInstance")
            .ensure(t => t.version === version, "could not reconstruct rebase version");
        const rebaseVersion = rebaseVersionInstance.version;
        const rebaseState = AggregateStateHelper.serializeStateIntoSnapshot(rebaseVersionInstance.state);
        clearBaseState(rebaseState);

        const defaultState = AggregateStateHelper.serializeStateIntoSnapshot(this._stateFactory.create());
        clearBaseState(defaultState);

        // const rebaseEvent = rebasedEventFactoryFunc != null
        //     ? rebasedEventFactoryFunc(defaultState, rebaseState, rebaseVersion)
        //     : new AggregateRebased({ defaultState, rebaseState, rebaseVersion });

        const rebaseEvent = rebasedEventFactoryFunc(defaultState, rebaseState, rebaseVersion);

        this.applyEvent(rebaseEvent);

        // console.log("rebaseEvent");
        // console.dir(rebaseEvent);

        // console.log("rebaseEvent serialized");
        // console.dir(rebaseEvent.serialize());

        // console.log("rebaseEvent deserialized");
        // console.dir(Deserializer.deserialize(rebaseEvent.serialize()));
    }

    /**
     * Applies a new (current/uncommitted) event to the aggregate; call this from your aggregate's
     * behavior methods.
     * @throws if the event is a created event and the aggregate already has events.
     */
    protected applyEvent(event: TDomainEvent): void
    {
        given(event, "event").ensureHasValue().ensureIsObject().ensureIsInstanceOf(DomainEvent)
            .ensure(t => t.isCreatedEvent ? this._retroEvents.isEmpty && this._currentEvents.isEmpty : true,
                "'isCreatedEvent = true' cannot be the case for multiple events");

        event.apply(this, this._domainContext, this._state);

        this._currentEvents.push(event);

        // if (this._retroEvents.length > 0)
        // {
        //     const trimmed = this.trim(this._retroEvents.orderBy(t => t.version)).orderBy(t => t.version);
        //     given(trimmed, "trimmed").ensureHasValue().ensureIsArray()
        //         .ensure(t => t.length > 0, "cannot trim all retro events")
        //         .ensure(t => t.length <= this._retroEvents.length, "only contraction is allowed")
        //         .ensure(t => t.some(u => u.isCreatedEvent), "cannot trim created event")
        //         .ensure(t => t.count(u => u.isCreatedEvent) === 1, "cannot add new created events")
        //         .ensure(t => t.every(u => this._retroEvents.contains(u)), "cannot add new events")
        //         ;

        //     this._retroEvents = trimmed;
        // }
    }
    // /**
    //  *
    //  * @deprecated DO NOT USE
    //  * @description override to trim retro events on the application of a new event
    //  */
    // protected trim(retroEvents: ReadonlyArray<DomainEvent<T>>): ReadonlyArray<DomainEvent<T>>
    // {
    //     given(retroEvents, "retroEvents").ensureHasValue().ensureIsArray().ensure(t => t.length > 0);

    //     return retroEvents;
    // }
}