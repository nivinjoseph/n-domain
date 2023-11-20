"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregateRoot = void 0;
const tslib_1 = require("tslib");
const domain_event_1 = require("./domain-event");
const aggregate_state_1 = require("./aggregate-state");
const n_defensive_1 = require("@nivinjoseph/n-defensive");
const n_util_1 = require("@nivinjoseph/n-util");
const Crypto = require("crypto");
// import { AggregateRebased } from "./aggregate-rebased";
const aggregate_state_helper_1 = require("./aggregate-state-helper");
// public
class AggregateRoot extends n_util_1.Serializable {
    constructor(domainContext, events, stateFactory, currentState) {
        super({});
        this._currentEvents = new Array(); // track unit of work stuff
        this._isNew = false;
        this._isReconstructed = false;
        this._reconstructedFromVersion = 0;
        (0, n_defensive_1.given)(domainContext, "domainContext").ensureHasValue()
            .ensureHasStructure({ userId: "string" });
        this._domainContext = domainContext;
        (0, n_defensive_1.given)(events, "events").ensureHasValue().ensureIsArray();
        (0, n_defensive_1.given)(stateFactory, "stateFactory").ensureHasValue().ensureIsObject();
        this._stateFactory = stateFactory;
        (0, n_defensive_1.given)(currentState, "currentState").ensureIsObject();
        this._state = Object.assign(this._stateFactory.create(), currentState);
        if (this._state.version) {
            (0, n_defensive_1.given)(events, "events")
                .ensure(t => t.length === 0, "no events should be passed when constructing from snapshot");
            this._retroEvents = [];
        }
        else {
            (0, n_defensive_1.given)(events, "events")
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
    static deserializeFromEvents(domainContext, aggregateType, eventData) {
        (0, n_defensive_1.given)(domainContext, "domainContext").ensureHasValue().ensureHasStructure({ userId: "string" });
        (0, n_defensive_1.given)(aggregateType, "aggregateType").ensureHasValue().ensureIsFunction();
        (0, n_defensive_1.given)(eventData, "eventData").ensureHasValue().ensureIsArray().ensure(t => t.length > 0);
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
            return n_util_1.Deserializer.deserialize(eventData);
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
        (0, n_defensive_1.given)(domainContext, "domainContext").ensureHasValue().ensureHasStructure({ userId: "string" });
        (0, n_defensive_1.given)(aggregateType, "aggregateType").ensureHasValue().ensureIsFunction();
        (0, n_defensive_1.given)(stateFactory, "stateFactory").ensureHasValue().ensureIsObject();
        (0, n_defensive_1.given)(stateSnapshot, "stateSnapshot").ensureHasValue().ensureIsObject()
            .ensureHasStructure({
            id: "string",
            version: "number",
            createdAt: "number",
            updatedAt: "number"
        });
        return new aggregateType(domainContext, [], stateFactory.deserializeSnapshot(stateSnapshot));
    }
    snapshot(...cloneKeys) {
        return aggregate_state_helper_1.AggregateStateHelper.serializeStateIntoSnapshot(this.state, ...cloneKeys);
    }
    constructVersion(version) {
        (0, n_defensive_1.given)(version, "version").ensureHasValue().ensureIsNumber()
            .ensure(t => t > 0 && t <= this.version, `version must be > 0 and <= ${this.version} (current version)`);
        (0, n_defensive_1.given)(this, "this").ensure(t => t.retroEvents.length > 0, "invoking method on object without retro events");
        const ctor = this.constructor;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        const result = new ctor(this._domainContext, this.events.filter(t => t.version <= version));
        result._isReconstructed = true;
        result._reconstructedFromVersion = this.version;
        return result;
    }
    constructBefore(dateTime) {
        (0, n_defensive_1.given)(dateTime, "dateTime").ensureHasValue().ensureIsNumber()
            .ensure(t => t > this.createdAt, "dateTime must be before createdAt");
        (0, n_defensive_1.given)(this, "this").ensure(t => t.retroEvents.length > 0, "invoking method on object without retro events");
        const ctor = this.constructor;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        const result = new ctor(this._domainContext, this.events.filter(t => t.occurredAt < dateTime));
        result._isReconstructed = true;
        result._reconstructedFromVersion = this.version;
        return this;
    }
    hasEventOfType(eventType) {
        (0, n_defensive_1.given)(eventType, "eventType").ensureHasValue().ensureIsFunction();
        (0, n_defensive_1.given)(this, "this").ensure(t => t.retroEvents.length > 0, "invoking method on object without retro events");
        const eventTypeName = eventType.getTypeName();
        return this.events.some(t => t.name === eventTypeName);
    }
    hasRetroEventOfType(eventType) {
        (0, n_defensive_1.given)(eventType, "eventType").ensureHasValue().ensureIsFunction();
        (0, n_defensive_1.given)(this, "this").ensure(t => t.retroEvents.length > 0, "invoking method on object without retro events");
        const eventTypeName = eventType.getTypeName();
        return this._retroEvents.some(t => t.name === eventTypeName);
    }
    hasCurrentEventOfType(eventType) {
        (0, n_defensive_1.given)(eventType, "eventType").ensureHasValue().ensureIsFunction();
        const eventTypeName = eventType.getTypeName();
        return this._currentEvents.some(t => t.name === eventTypeName);
    }
    getEventsOfType(eventType) {
        (0, n_defensive_1.given)(eventType, "eventType").ensureHasValue().ensureIsFunction();
        (0, n_defensive_1.given)(this, "this").ensure(t => t.retroEvents.length > 0, "invoking method on object without retro events");
        const eventTypeName = eventType.getTypeName();
        return this.events.filter(t => t.name === eventTypeName);
    }
    getRetroEventsOfType(eventType) {
        (0, n_defensive_1.given)(eventType, "eventType").ensureHasValue().ensureIsFunction();
        (0, n_defensive_1.given)(this, "this").ensure(t => t.retroEvents.length > 0, "invoking method on object without retro events");
        const eventTypeName = eventType.getTypeName();
        return this._retroEvents.filter(t => t.name === eventTypeName);
    }
    getCurrentEventsOfType(eventType) {
        (0, n_defensive_1.given)(eventType, "eventType").ensureHasValue().ensureIsFunction();
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
        (0, n_defensive_1.given)(domainContext, "domainContext").ensureHasValue()
            .ensureHasStructure({ userId: "string" });
        (0, n_defensive_1.given)(createdEvent, "createdEvent").ensureHasValue().ensureIsInstanceOf(domain_event_1.DomainEvent)
            .ensure(t => t.isCreatedEvent, "must be created event");
        (0, n_defensive_1.given)(serializedEventMutatorAndFilter, "serializedEventMutator").ensureIsFunction();
        (0, n_defensive_1.given)(this, "this").ensure(t => t.retroEvents.length > 0, "invoking method on object without retro events");
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
            clone.applyEvent(n_util_1.Deserializer.deserialize(serializedEvent));
        });
        return clone;
    }
    test() {
        const type = this.constructor;
        (0, n_defensive_1.given)(type, "type").ensureHasValue().ensureIsFunction()
            .ensure(t => t.getTypeName() === this.getTypeName(), "type name mismatch");
        const defaultState = this._stateFactory.create();
        (0, n_defensive_1.given)(defaultState, "defaultState").ensureHasValue().ensureIsObject()
            .ensure(t => JSON.stringify(t) === JSON.stringify(this._stateFactory.create()), "multiple default state creations are not consistent");
        const deserializeEvents = type.deserializeEvents;
        (0, n_defensive_1.given)(deserializeEvents, "deserializeEvents").ensureHasValue().ensureIsFunction();
        const eventsSerialized = this.serialize();
        (0, n_defensive_1.given)(eventsSerialized, "eventsSerialized").ensureHasValue().ensureIsObject()
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
        (0, n_defensive_1.given)(eventsDeserializedAggregate, "eventsDeserializedAggregate").ensureHasValue().ensureIsObject().ensureIsType(type);
        const eventsDeserializedAggregateState = eventsDeserializedAggregate.state;
        console.log("eventsDeserializedAggregateState", JSON.stringify(eventsDeserializedAggregateState));
        console.log("state", JSON.stringify(this.state));
        const eventsDeserializedAggregateStateHash = Crypto.createHash("sha512")
            .update(JSON.stringify(eventsDeserializedAggregateState).trim())
            .digest("hex").toUpperCase();
        const originalStateHash = Crypto.createHash("sha512")
            .update(JSON.stringify(this.state).trim())
            .digest("hex").toUpperCase();
        (0, n_defensive_1.given)(eventsDeserializedAggregateStateHash, "eventsDeserializedAggregateStateHash").ensureHasValue().ensureIsString()
            .ensure(t => t === originalStateHash, "state is not consistent with original state");
        const deserializeSnapshot = type.deserializeSnapshot;
        (0, n_defensive_1.given)(deserializeSnapshot, "deserializeSnapshot").ensureHasValue().ensureIsFunction();
        const snapshot = this.snapshot();
        (0, n_defensive_1.given)(snapshot, "snapshot").ensureHasValue().ensureIsObject()
            .ensure(t => JSON.stringify(t) === JSON.stringify(this.snapshot()), "multiple snapshots are not consistent");
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        const snapshotDeserializedAggregate = type.deserializeSnapshot(this._domainContext, snapshot);
        (0, n_defensive_1.given)(snapshotDeserializedAggregate, "snapshotDeserializedAggregate").ensureHasValue().ensureIsObject().ensureIsType(type);
        const snapshotDeserializedAggregateState = snapshotDeserializedAggregate.state;
        (0, n_defensive_1.given)(snapshotDeserializedAggregateState, "snapshotDeserializedAggregateState").ensureHasValue().ensureIsObject()
            .ensure(t => JSON.stringify(t) === JSON.stringify(this.state), "state is not consistent with original state");
    }
    rebase(version, rebasedEventFactoryFunc) {
        (0, n_defensive_1.given)(version, "version").ensureHasValue().ensureIsNumber()
            .ensure(t => t > 0 && t <= this.version, `version must be > 0 and <= ${this.version} (current version)`);
        (0, n_defensive_1.given)(rebasedEventFactoryFunc, "rebasedEventFactoryFunc").ensureHasValue().ensureIsFunction();
        const rebaseVersionInstance = this.constructVersion(version);
        (0, n_defensive_1.given)(rebaseVersionInstance, "rebaseVersionInstance")
            .ensure(t => t.version === version, "could not reconstruct rebase version");
        const rebaseVersion = rebaseVersionInstance.version;
        const rebaseState = aggregate_state_helper_1.AggregateStateHelper.serializeStateIntoSnapshot(rebaseVersionInstance.state);
        (0, aggregate_state_1.clearBaseState)(rebaseState);
        const defaultState = aggregate_state_helper_1.AggregateStateHelper.serializeStateIntoSnapshot(this._stateFactory.create());
        (0, aggregate_state_1.clearBaseState)(defaultState);
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
        (0, n_defensive_1.given)(event, "event").ensureHasValue().ensureIsObject().ensureIsInstanceOf(domain_event_1.DomainEvent)
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
}
tslib_1.__decorate([
    (0, n_util_1.serialize)("$id"),
    tslib_1.__metadata("design:type", String),
    tslib_1.__metadata("design:paramtypes", [])
], AggregateRoot.prototype, "id", null);
tslib_1.__decorate([
    (0, n_util_1.serialize)("$events"),
    tslib_1.__metadata("design:type", Array),
    tslib_1.__metadata("design:paramtypes", [])
], AggregateRoot.prototype, "events", null);
tslib_1.__decorate([
    (0, n_util_1.serialize)("$version"),
    tslib_1.__metadata("design:type", Number),
    tslib_1.__metadata("design:paramtypes", [])
], AggregateRoot.prototype, "version", null);
tslib_1.__decorate([
    (0, n_util_1.serialize)("$createdAt"),
    tslib_1.__metadata("design:type", Number),
    tslib_1.__metadata("design:paramtypes", [])
], AggregateRoot.prototype, "createdAt", null);
tslib_1.__decorate([
    (0, n_util_1.serialize)("$updatedAt"),
    tslib_1.__metadata("design:type", Number),
    tslib_1.__metadata("design:paramtypes", [])
], AggregateRoot.prototype, "updatedAt", null);
exports.AggregateRoot = AggregateRoot;
//# sourceMappingURL=aggregate-root.js.map