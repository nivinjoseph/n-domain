import { __esDecorate, __runInitializers } from "tslib";
import { given } from "@nivinjoseph/n-defensive";
import { Deserializer, Serializable, serialize } from "@nivinjoseph/n-util";
import { createHash } from "node:crypto";
import { clearBaseState } from "./aggregate-state.js";
import { DomainEvent } from "./domain-event.js";
// import { AggregateRebased } from "./aggregate-rebased";
import { AggregateStateHelper } from "./aggregate-state-helper.js";
// public
let AggregateRoot = (() => {
    var _a;
    let _classSuper = Serializable;
    let _instanceExtraInitializers = [];
    let _get_id_decorators;
    let _get_events_decorators;
    let _get_version_decorators;
    let _get_createdAt_decorators;
    let _get_updatedAt_decorators;
    return _a = class AggregateRoot extends _classSuper {
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
            constructor(domainContext, events, stateFactory, currentState) {
                super({});
                this._domainContext = __runInitializers(this, _instanceExtraInitializers);
                this._currentEvents = new Array(); // track unit of work stuff
                this._isNew = false;
                this._isReconstructed = false;
                this._reconstructedFromVersion = 0;
                given(domainContext, "domainContext").ensureHasValue()
                    .ensureHasStructure({ userId: "string" });
                this._domainContext = domainContext;
                given(events, "events").ensureHasValue().ensureIsArray();
                given(stateFactory, "stateFactory").ensureHasValue().ensureIsObject();
                this._stateFactory = stateFactory;
                given(currentState, "currentState").ensureIsObject();
                this._state = Object.assign(this._stateFactory.create(), currentState);
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
                    this._retroEvents = events;
                    if (this._retroEvents.some(t => t._aggregateId == null)) // Deliberate workaround to access aggregateId
                        this._isNew = true;
                    if (this._isNew)
                        this._retroEvents.forEach(t => t.apply(this, this._domainContext, this._state));
                    else
                        this._retroEvents.orderBy(t => t.version).forEach(t => t.apply(this, this._domainContext, this._state));
                }
                this._state = this._stateFactory.update(this._state);
                this._retroVersion = this.currentVersion;
            }
            static deserializeFromEvents(domainContext, aggregateType, eventData) {
                given(domainContext, "domainContext").ensureHasValue().ensureHasStructure({ userId: "string" });
                given(aggregateType, "aggregateType").ensureHasValue().ensureIsFunction();
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
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                return new aggregateType(domainContext, deserializedEvents);
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
                return new aggregateType(domainContext, [], stateFactory.deserializeSnapshot(stateSnapshot));
            }
            snapshot(...cloneKeys) {
                return AggregateStateHelper.serializeStateIntoSnapshot(this.state, ...cloneKeys);
            }
            constructVersion(version) {
                given(version, "version").ensureHasValue().ensureIsNumber()
                    .ensure(t => t > 0 && t <= this.version, `version must be > 0 and <= ${this.version} (current version)`);
                given(this, "this").ensure(t => t.retroEvents.length > 0, "invoking method on object without retro events");
                const ctor = this.constructor;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                const result = new ctor(this._domainContext, this.events.filter(t => t.version <= version));
                result._isReconstructed = true;
                result._reconstructedFromVersion = this.version;
                return result;
            }
            constructBefore(dateTime) {
                given(dateTime, "dateTime").ensureHasValue().ensureIsNumber()
                    .ensure(t => t > this.createdAt, "dateTime must be before createdAt");
                given(this, "this").ensure(t => t.retroEvents.length > 0, "invoking method on object without retro events");
                const ctor = this.constructor;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                const result = new ctor(this._domainContext, this.events.filter(t => t.occurredAt < dateTime));
                result._isReconstructed = true;
                result._reconstructedFromVersion = this.version;
                return this;
            }
            hasEventOfType(eventType) {
                given(eventType, "eventType").ensureHasValue().ensureIsFunction();
                given(this, "this").ensure(t => t.retroEvents.length > 0, "invoking method on object without retro events");
                const eventTypeName = eventType.getTypeName();
                return this.events.some(t => t.name === eventTypeName);
            }
            hasRetroEventOfType(eventType) {
                given(eventType, "eventType").ensureHasValue().ensureIsFunction();
                given(this, "this").ensure(t => t.retroEvents.length > 0, "invoking method on object without retro events");
                const eventTypeName = eventType.getTypeName();
                return this._retroEvents.some(t => t.name === eventTypeName);
            }
            hasCurrentEventOfType(eventType) {
                given(eventType, "eventType").ensureHasValue().ensureIsFunction();
                const eventTypeName = eventType.getTypeName();
                return this._currentEvents.some(t => t.name === eventTypeName);
            }
            getEventsOfType(eventType) {
                given(eventType, "eventType").ensureHasValue().ensureIsFunction();
                given(this, "this").ensure(t => t.retroEvents.length > 0, "invoking method on object without retro events");
                const eventTypeName = eventType.getTypeName();
                return this.events.filter(t => t.name === eventTypeName);
            }
            getRetroEventsOfType(eventType) {
                given(eventType, "eventType").ensureHasValue().ensureIsFunction();
                given(this, "this").ensure(t => t.retroEvents.length > 0, "invoking method on object without retro events");
                const eventTypeName = eventType.getTypeName();
                return this._retroEvents.filter(t => t.name === eventTypeName);
            }
            getCurrentEventsOfType(eventType) {
                given(eventType, "eventType").ensureHasValue().ensureIsFunction();
                const eventTypeName = eventType.getTypeName();
                return this._currentEvents.filter(t => t.name === eventTypeName);
            }
            /**
             *
             * @param domainContext - provide the Domain Context
             * @param createdEvent - provide a new created event to be used by the clone
             * @param serializedEventMutatorAndFilter - provide a function that can mutate the serialized event if required and returns a boolean indicating whether to include the event or not.
             * @returns - cloned Aggregate
             */
            clone(domainContext, createdEvent, serializedEventMutatorAndFilter) {
                given(domainContext, "domainContext").ensureHasValue()
                    .ensureHasStructure({ userId: "string" });
                given(createdEvent, "createdEvent").ensureHasValue().ensureIsInstanceOf(DomainEvent)
                    .ensure(t => t.isCreatedEvent, "must be created event");
                // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
                given(serializedEventMutatorAndFilter, "serializedEventMutator").ensureIsFunction();
                given(this, "this").ensure(t => t.retroEvents.length > 0, "invoking method on object without retro events");
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                const clone = new this.constructor(domainContext, [createdEvent]);
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
            test() {
                const type = this.constructor;
                given(type, "type").ensureHasValue().ensureIsFunction()
                    .ensure(t => t.getTypeName() === this.getTypeName(), "type name mismatch");
                const defaultState = this._stateFactory.create();
                given(defaultState, "defaultState").ensureHasValue().ensureIsObject()
                    .ensure(t => JSON.stringify(t) === JSON.stringify(this._stateFactory.create()), "multiple default state creations are not consistent");
                // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
                const deserializeEvents = type.deserializeEvents;
                given(deserializeEvents, "deserializeEvents").ensureHasValue().ensureIsFunction();
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
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                const eventsDeserializedAggregate = type.deserializeEvents(this._domainContext, eventsSerialized.$events);
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
                // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
                const deserializeSnapshot = type.deserializeSnapshot;
                given(deserializeSnapshot, "deserializeSnapshot").ensureHasValue().ensureIsFunction();
                const snapshot = this.snapshot();
                given(snapshot, "snapshot").ensureHasValue().ensureIsObject()
                    .ensure(t => JSON.stringify(t) === JSON.stringify(this.snapshot()), "multiple snapshots are not consistent");
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                const snapshotDeserializedAggregate = type.deserializeSnapshot(this._domainContext, snapshot);
                given(snapshotDeserializedAggregate, "snapshotDeserializedAggregate").ensureHasValue().ensureIsObject().ensureIsType(type);
                const snapshotDeserializedAggregateState = snapshotDeserializedAggregate.state;
                given(snapshotDeserializedAggregateState, "snapshotDeserializedAggregateState").ensureHasValue().ensureIsObject()
                    .ensure(t => JSON.stringify(t) === JSON.stringify(this.state), "state is not consistent with original state");
            }
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
        },
        (() => {
            var _b;
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_b = _classSuper[Symbol.metadata]) !== null && _b !== void 0 ? _b : null) : void 0;
            _get_id_decorators = [serialize("$id")];
            _get_events_decorators = [serialize("$events")];
            _get_version_decorators = [serialize("$version")];
            _get_createdAt_decorators = [serialize("$createdAt")];
            _get_updatedAt_decorators = [serialize("$updatedAt")];
            __esDecorate(_a, null, _get_id_decorators, { kind: "getter", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _get_events_decorators, { kind: "getter", name: "events", static: false, private: false, access: { has: obj => "events" in obj, get: obj => obj.events }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _get_version_decorators, { kind: "getter", name: "version", static: false, private: false, access: { has: obj => "version" in obj, get: obj => obj.version }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _get_createdAt_decorators, { kind: "getter", name: "createdAt", static: false, private: false, access: { has: obj => "createdAt" in obj, get: obj => obj.createdAt }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _get_updatedAt_decorators, { kind: "getter", name: "updatedAt", static: false, private: false, access: { has: obj => "updatedAt" in obj, get: obj => obj.updatedAt }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
export { AggregateRoot };
//# sourceMappingURL=aggregate-root.js.map