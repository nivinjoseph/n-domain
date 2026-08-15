import { __esDecorate, __runInitializers } from "tslib";
import { given } from "@nivinjoseph/n-defensive";
import { Deserializer, Serializable, serialize } from "@nivinjoseph/n-util";
import { createHash } from "node:crypto";
import { clearBaseState } from "./aggregate-state.js";
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
let AggregateRoot = (() => {
    let _classSuper = Serializable;
    let _instanceExtraInitializers = [];
    let _get_id_decorators;
    let _get_events_decorators;
    let _get_version_decorators;
    let _get_createdAt_decorators;
    let _get_updatedAt_decorators;
    return class AggregateRoot extends _classSuper {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _get_id_decorators = [serialize("$id")];
            _get_events_decorators = [serialize("$events")];
            _get_version_decorators = [serialize("$version")];
            _get_createdAt_decorators = [serialize("$createdAt")];
            _get_updatedAt_decorators = [serialize("$updatedAt")];
            __esDecorate(this, null, _get_id_decorators, { kind: "getter", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _get_events_decorators, { kind: "getter", name: "events", static: false, private: false, access: { has: obj => "events" in obj, get: obj => obj.events }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _get_version_decorators, { kind: "getter", name: "version", static: false, private: false, access: { has: obj => "version" in obj, get: obj => obj.version }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _get_createdAt_decorators, { kind: "getter", name: "createdAt", static: false, private: false, access: { has: obj => "createdAt" in obj, get: obj => obj.createdAt }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _get_updatedAt_decorators, { kind: "getter", name: "updatedAt", static: false, private: false, access: { has: obj => "updatedAt" in obj, get: obj => obj.updatedAt }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        _domainContext = __runInitializers(this, _instanceExtraInitializers);
        _stateFactory;
        _state;
        _retroEvents;
        _retroVersion;
        _currentEvents = new Array(); // track unit of work stuff
        _isNew = false;
        _isReconstructed = false;
        _reconstructedFromVersion = 0;
        get state() { return this._state; }
        get context() { return this._domainContext; }
        get id() { return this._state.id; }
        get retroEvents() { return this._retroEvents.orderBy(t => t.version); }
        get retroVersion() { return this._retroVersion; }
        get currentEvents() { return this._currentEvents.orderBy(t => t.version); }
        get currentVersion() { return this._state.version; }
        get events() { return [...this._retroEvents, ...this._currentEvents].orderBy(t => t.version); }
        get version() { return this.currentVersion; }
        get createdAt() { return this._state.createdAt; }
        get updatedAt() { return this._state.updatedAt; }
        get isNew() { return this._isNew; } // this will always be false for anything that is reconstructed
        get hasChanges() { return this.currentVersion !== this.retroVersion; }
        get isReconstructed() { return this._isReconstructed; }
        get reconstructedFromVersion() { return this._reconstructedFromVersion; }
        get isRebased() { return this._state.isRebased; }
        get rebasedFromVersion() { return this._state.rebasedFromVersion; }
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
        constructor(domainContext, events, stateFactory, currentState) {
            super({});
            given(domainContext, "domainContext").ensureHasValue()
                .ensureHasStructure({ userId: "string" });
            this._domainContext = domainContext;
            given(events, "events").ensureHasValue().ensureIsArray();
            given(stateFactory, "stateFactory").ensureHasValue().ensureIsObject();
            this._stateFactory = stateFactory;
            given(currentState, "currentState").ensureIsObject();
            const defaultState = this._stateFactory.create();
            const currentTypeVersion = defaultState.typeVersion;
            this._state = Object.assign(defaultState, currentState);
            if (this._state.version) {
                given(events, "events")
                    .ensure(t => t.length === 0, "no events should be passed when constructing from snapshot");
                this._retroEvents = [];
            }
            else {
                given(events, "events")
                    .ensure(t => t.length > 0, "no events passed")
                    .ensure(t => t.some(u => u.isCreatedEvent), "no created event passed")
                    .ensure(t => t.count(u => u.isCreatedEvent) === 1, "more than one created event passed");
                this._retroEvents = [...events];
                if (this._retroEvents.some(t => t._aggregateId == null)) // Deliberate workaround to access aggregateId
                    this._isNew = true;
                if (this._isNew) {
                    // freeze the pristine default state (current create() output, captured here before any event
                    // mutates this._state) into the created event, with base fields stripped. on every future
                    // replay this is overlaid as the base layer so fields no event writes are sourced from the
                    // stream rather than from a (possibly changed) future create().
                    const frozenDefaultState = AggregateStateHelper.serializeStateIntoSnapshot(this._state);
                    clearBaseState(frozenDefaultState);
                    const createdEvent = this._retroEvents.find(t => t.isCreatedEvent);
                    // stamp the frozen defaults onto the created event's internal field via cast (same workaround as
                    // _aggregateId above), keeping this framework detail off DomainEvent's public surface.
                    given(createdEvent, "createdEvent")
                        .ensure(t => t._frozenDefaultState == null, "created event already has frozen default state");
                    createdEvent._frozenDefaultState = frozenDefaultState;
                    this._retroEvents.forEach(t => t.apply(this, this._domainContext, this._state));
                }
                else
                    this._retroEvents.orderBy(t => t.version).forEach(t => t.apply(this, this._domainContext, this._state));
            }
            this._state = this._stateFactory.update(this._state);
            given(this._state, "state").ensure(t => t.typeVersion === currentTypeVersion, `loaded state has typeVersion ${this._state.typeVersion} but the current type version is ${currentTypeVersion}; `
                + "migrate it forward in the state factory's update() method (and bump state.typeVersion)");
            this._retroVersion = this.currentVersion;
        }
        /**
         * Rehydrates an aggregate by deserializing stored event data (via the `@serialize` registry)
         * and replaying the full stream. Every event type must be decorated with
         * `@serialize("Namespace")` or deserialization fails.
         */
        static deserializeFromEvents(domainContext, aggregateType, stateFactory, eventData) {
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
            const deserializedEvents = eventData.map((eventData) => {
                return Deserializer.deserialize(eventData);
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
        static deserializeFromSnapshot(domainContext, aggregateType, stateFactory, stateSnapshot) {
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
        snapshot(...cloneKeys) {
            return AggregateStateHelper.serializeStateIntoSnapshot(this.state, ...cloneKeys);
        }
        /**
         * Reconstructs the aggregate as of `version` by replaying only the events up to it.
         * @throws if `version` is out of range, or when called on an aggregate without retro events
         * (freshly created or snapshot-loaded).
         */
        constructVersion(version) {
            given(version, "version").ensureHasValue().ensureIsNumber()
                .ensure(t => t > 0 && t <= this.version, `version must be > 0 and <= ${this.version} (current version)`);
            given(this, "this").ensure(t => t.retroEvents.length > 0, "invoking method on object without retro events");
            // const ctor = (<Object>this).constructor;
            // // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            // const result = new (<any>ctor)(this._domainContext, this.events.filter(t => t.version <= version)) as this;
            const result = new AggregateFactory(this.constructor, this._domainContext, this._stateFactory)
                .createFromEvents(this.events.filter(t => t.version <= version));
            result._isReconstructed = true;
            result._reconstructedFromVersion = this.version;
            return result;
        }
        /**
         * Reconstructs the aggregate as of just before `dateTime` (epoch ms) by replaying only the
         * events that occurred earlier.
         * @throws if `dateTime` is not after `createdAt`, or when called on an aggregate without retro
         * events (freshly created or snapshot-loaded).
         */
        constructBefore(dateTime) {
            given(dateTime, "dateTime").ensureHasValue().ensureIsNumber()
                .ensure(t => t > this.createdAt, "dateTime must be after createdAt");
            given(this, "this").ensure(t => t.retroEvents.length > 0, "invoking method on object without retro events");
            // const ctor = (<Object>this).constructor;
            // // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            // const result = new (<any>ctor)(this._domainContext, this.events.filter(t => t.occurredAt < dateTime)) as this;
            const result = new AggregateFactory(this.constructor, this._domainContext, this._stateFactory)
                .createFromEvents(this.events.filter(t => t.occurredAt < dateTime));
            result._isReconstructed = true;
            result._reconstructedFromVersion = this.version;
            return result;
        }
        /**
         * Checks all events (retro + current) for an event of the given type.
         * @throws when called on an aggregate without retro events (freshly created or
         * snapshot-loaded); use `hasCurrentEventOfType` there instead.
         */
        hasEventOfType(eventType) {
            given(eventType, "eventType").ensureHasValue().ensureIsFunction();
            given(this, "this").ensure(t => t.retroEvents.length > 0, "invoking method on object without retro events");
            const eventTypeName = eventType.getTypeName();
            return this.events.some(t => t.name === eventTypeName);
        }
        /**
         * Checks the persisted (retro) events for an event of the given type.
         * @throws when called on an aggregate without retro events (freshly created or snapshot-loaded).
         */
        hasRetroEventOfType(eventType) {
            given(eventType, "eventType").ensureHasValue().ensureIsFunction();
            given(this, "this").ensure(t => t.retroEvents.length > 0, "invoking method on object without retro events");
            const eventTypeName = eventType.getTypeName();
            return this._retroEvents.some(t => t.name === eventTypeName);
        }
        /**
         * Checks the uncommitted (current) events for an event of the given type. Safe on any
         * aggregate, including freshly created ones.
         */
        hasCurrentEventOfType(eventType) {
            given(eventType, "eventType").ensureHasValue().ensureIsFunction();
            const eventTypeName = eventType.getTypeName();
            return this._currentEvents.some(t => t.name === eventTypeName);
        }
        /**
         * Returns all events (retro + current) of the given type.
         * @throws when called on an aggregate without retro events (freshly created or
         * snapshot-loaded); use `getCurrentEventsOfType` there instead.
         */
        getEventsOfType(eventType) {
            given(eventType, "eventType").ensureHasValue().ensureIsFunction();
            given(this, "this").ensure(t => t.retroEvents.length > 0, "invoking method on object without retro events");
            const eventTypeName = eventType.getTypeName();
            return this.events.filter(t => t.name === eventTypeName);
        }
        /**
         * Returns the persisted (retro) events of the given type.
         * @throws when called on an aggregate without retro events (freshly created or snapshot-loaded).
         */
        getRetroEventsOfType(eventType) {
            given(eventType, "eventType").ensureHasValue().ensureIsFunction();
            given(this, "this").ensure(t => t.retroEvents.length > 0, "invoking method on object without retro events");
            const eventTypeName = eventType.getTypeName();
            return this._retroEvents.filter(t => t.name === eventTypeName);
        }
        /**
         * Returns the uncommitted (current) events of the given type. Safe on any aggregate,
         * including freshly created ones.
         */
        getCurrentEventsOfType(eventType) {
            given(eventType, "eventType").ensureHasValue().ensureIsFunction();
            const eventTypeName = eventType.getTypeName();
            return this._currentEvents.filter(t => t.name === eventTypeName);
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
        clone(createdEvent, serializedEventMutatorAndFilter) {
            given(createdEvent, "createdEvent").ensureHasValue().ensureIsInstanceOf(DomainEvent)
                .ensure(t => t.isCreatedEvent, "must be created event");
            // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
            given(serializedEventMutatorAndFilter, "serializedEventMutator").ensureIsFunction();
            given(this, "this").ensure(t => t.retroEvents.length > 0, "invoking method on object without retro events");
            // // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            // const clone: this = new (<any>this.constructor)(domainContext, [createdEvent]);
            const clone = new AggregateFactory(this.constructor, this._domainContext, this._stateFactory)
                .createFromEvents([createdEvent]);
            this.events
                .where(t => !t.isCreatedEvent)
                .forEach(t => {
                const serializedEvent = t.serialize();
                if (serializedEventMutatorAndFilter != null) {
                    const keep = serializedEventMutatorAndFilter(serializedEvent);
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
            return clone;
        }
        /**
         * Self-check that serialization, event replay, and snapshot round-trips all reproduce
         * identical state, and that the state factory's `create()` is deterministic. Intended to be
         * called from your test suite.
         */
        test() {
            const type = this.constructor;
            given(type, "type").ensureHasValue().ensureIsFunction()
                .ensure(t => t.getTypeName() === this.getTypeName(), "type name mismatch");
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
            const eventsDeserializedAggregate = AggregateRoot.deserializeFromEvents(this._domainContext, type, this._stateFactory, eventsSerialized.$events);
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
            const snapshotDeserializedAggregate = AggregateRoot.deserializeFromSnapshot(this._domainContext, type, this._stateFactory, snapshot);
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
        rebase(version, rebasedEventFactoryFunc) {
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
        applyEvent(event) {
            given(event, "event").ensureHasValue().ensureIsObject().ensureIsInstanceOf(DomainEvent)
                .ensure(t => t.isCreatedEvent ? this._retroEvents.isEmpty && this._currentEvents.isEmpty : true, "'isCreatedEvent = true' cannot be the case for multiple events");
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
    };
})();
export { AggregateRoot };
//# sourceMappingURL=aggregate-root.js.map