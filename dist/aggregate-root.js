"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregateRoot = void 0;
const n_defensive_1 = require("@nivinjoseph/n-defensive");
const n_exception_1 = require("@nivinjoseph/n-exception");
require("@nivinjoseph/n-ext");
const domain_object_1 = require("./domain-object");
const n_util_1 = require("@nivinjoseph/n-util");
const Crypto = require("crypto");
// public
class AggregateRoot extends n_util_1.Serializable {
    constructor(domainContext, events, stateFactory, currentState) {
        super({});
        this._currentEvents = new Array(); // track unit of work stuff
        this._isNew = false;
        n_defensive_1.given(domainContext, "domainContext").ensureHasValue()
            .ensureHasStructure({ userId: "string" });
        this._domainContext = domainContext;
        n_defensive_1.given(events, "events").ensureHasValue().ensureIsArray();
        n_defensive_1.given(stateFactory, "stateFactory").ensureHasValue().ensureIsObject();
        this._stateFactory = stateFactory;
        n_defensive_1.given(currentState, "currentState").ensureIsObject();
        this._state = Object.assign(this._stateFactory.create(), currentState);
        if (this._state.version) {
            n_defensive_1.given(events, "events")
                .ensure(t => t.length === 0, "no events should be passed when constructing from snapshot");
            this._retroEvents = [];
        }
        else {
            n_defensive_1.given(events, "events")
                .ensure(t => t.length > 0, "no events passed")
                .ensure(t => t.some(u => u.isCreatedEvent), "no created event passed")
                .ensure(t => t.count(u => u.isCreatedEvent) === 1, "more than one created event passed");
            this._retroEvents = events;
            if (this._retroEvents.some(t => t.aggregateId == null))
                this._isNew = true;
            this._retroEvents.orderBy(t => t.version).forEach(t => t.apply(this, this._domainContext, this._state));
        }
        this._state = this._stateFactory.update(this._state);
        this._retroVersion = this.currentVersion;
    }
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
    get context() { return this._domainContext; }
    get state() { return this._state; }
    static deserializeFromEvents(domainContext, aggregateType, eventData) {
        n_defensive_1.given(domainContext, "domainContext").ensureHasValue().ensureHasStructure({ userId: "string" });
        n_defensive_1.given(aggregateType, "aggregateType").ensureHasValue().ensureIsFunction();
        n_defensive_1.given(eventData, "eventData").ensureHasValue().ensureIsArray().ensure(t => t.length > 0);
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
        n_defensive_1.given(domainContext, "domainContext").ensureHasValue().ensureHasStructure({ userId: "string" });
        n_defensive_1.given(aggregateType, "aggregateType").ensureHasValue().ensureIsFunction();
        n_defensive_1.given(stateFactory, "stateFactory").ensureHasValue().ensureIsObject();
        n_defensive_1.given(stateSnapshot, "stateSnapshot").ensureHasValue().ensureIsObject()
            .ensureHasStructure({
            id: "string",
            version: "number",
            createdAt: "number",
            updatedAt: "number"
        });
        return new aggregateType(domainContext, [], stateFactory.deserializeSnapshot(stateSnapshot));
    }
    snapshot(...cloneKeys) {
        const snapshot = Object.assign({}, this.state);
        Object.keys(snapshot).forEach(key => {
            const val = snapshot[key];
            if (val && typeof (val) === "object") {
                if (cloneKeys.contains(key)) {
                    snapshot[key] = JSON.parse(JSON.stringify(val));
                    return;
                }
                if (Array.isArray(val))
                    snapshot[key] = val.map(t => {
                        if (typeof (t) === "object")
                            return this.serializeForSnapshot(t);
                        else
                            return t;
                    });
                else
                    snapshot[key] = this.serializeForSnapshot(val);
            }
        });
        return snapshot;
    }
    constructVersion(version) {
        n_defensive_1.given(version, "version").ensureHasValue().ensureIsNumber()
            .ensure(t => t > 0 && t <= this.version, `version must be > 0 and <= ${this.version} (current version)`);
        n_defensive_1.given(this, "this").ensure(t => t.retroEvents.length > 0, "invoking method on object without retro events");
        const ctor = this.constructor;
        return new ctor(this._domainContext, this.events.filter(t => t.version <= version));
    }
    hasEventOfType(eventType) {
        n_defensive_1.given(eventType, "eventType").ensureHasValue().ensureIsFunction();
        n_defensive_1.given(this, "this").ensure(t => t.retroEvents.length > 0, "invoking method on object without retro events");
        const eventTypeName = eventType.getTypeName();
        return this.events.some(t => t.name === eventTypeName);
    }
    hasRetroEventOfType(eventType) {
        n_defensive_1.given(eventType, "eventType").ensureHasValue().ensureIsFunction();
        n_defensive_1.given(this, "this").ensure(t => t.retroEvents.length > 0, "invoking method on object without retro events");
        const eventTypeName = eventType.getTypeName();
        return this._retroEvents.some(t => t.name === eventTypeName);
    }
    hasCurrentEventOfType(eventType) {
        n_defensive_1.given(eventType, "eventType").ensureHasValue().ensureIsFunction();
        const eventTypeName = eventType.getTypeName();
        return this._currentEvents.some(t => t.name === eventTypeName);
    }
    getEventsOfType(eventType) {
        n_defensive_1.given(eventType, "eventType").ensureHasValue().ensureIsFunction();
        n_defensive_1.given(this, "this").ensure(t => t.retroEvents.length > 0, "invoking method on object without retro events");
        const eventTypeName = eventType.getTypeName();
        return this.events.filter(t => t.name === eventTypeName);
    }
    getRetroEventsOfType(eventType) {
        n_defensive_1.given(eventType, "eventType").ensureHasValue().ensureIsFunction();
        n_defensive_1.given(this, "this").ensure(t => t.retroEvents.length > 0, "invoking method on object without retro events");
        const eventTypeName = eventType.getTypeName();
        return this._retroEvents.filter(t => t.name === eventTypeName);
    }
    getCurrentEventsOfType(eventType) {
        n_defensive_1.given(eventType, "eventType").ensureHasValue().ensureIsFunction();
        const eventTypeName = eventType.getTypeName();
        return this._currentEvents.filter(t => t.name === eventTypeName);
    }
    test() {
        const type = this.constructor;
        n_defensive_1.given(type, "type").ensureHasValue().ensureIsFunction()
            .ensure(t => t.getTypeName() === this.getTypeName(), "type name mismatch");
        const defaultState = this._stateFactory.create();
        n_defensive_1.given(defaultState, "defaultState").ensureHasValue().ensureIsObject()
            .ensure(t => JSON.stringify(t) === JSON.stringify(this._stateFactory.create()), "multiple default state creations are not consistent");
        const deserializeEvents = type.deserializeEvents;
        n_defensive_1.given(deserializeEvents, "deserializeEvents").ensureHasValue().ensureIsFunction();
        const eventsSerialized = this.serialize();
        n_defensive_1.given(eventsSerialized, "eventsSerialized").ensureHasValue().ensureIsObject()
            .ensureHasStructure({
            $id: "string",
            $version: "number",
            $createdAt: "number",
            $updatedAt: "number",
            $events: ["object"]
        })
            .ensure(t => JSON.stringify(t) === JSON.stringify(this.serialize()), "multiple serializations are not consistent");
        const eventsDeserializedAggregate = type.deserializeEvents(this._domainContext, eventsSerialized.$events);
        n_defensive_1.given(eventsDeserializedAggregate, "eventsDeserializedAggregate").ensureHasValue().ensureIsObject().ensureIsType(type);
        const eventsDeserializedAggregateState = eventsDeserializedAggregate.state;
        console.log("eventsDeserializedAggregateState", JSON.stringify(eventsDeserializedAggregateState));
        console.log("state", JSON.stringify(this.state));
        const eventsDeserializedAggregateStateHash = Crypto.createHash("sha512")
            .update(JSON.stringify(eventsDeserializedAggregateState).trim())
            .digest("hex").toUpperCase();
        const originalStateHash = Crypto.createHash("sha512")
            .update(JSON.stringify(this.state).trim())
            .digest("hex").toUpperCase();
        n_defensive_1.given(eventsDeserializedAggregateStateHash, "eventsDeserializedAggregateStateHash").ensureHasValue().ensureIsString()
            .ensure(t => t === originalStateHash, "state is not consistent with original state");
        const deserializeSnapshot = type.deserializeSnapshot;
        n_defensive_1.given(deserializeSnapshot, "deserializeSnapshot").ensureHasValue().ensureIsFunction();
        const snapshot = this.snapshot();
        n_defensive_1.given(snapshot, "snapshot").ensureHasValue().ensureIsObject()
            .ensure(t => JSON.stringify(t) === JSON.stringify(this.snapshot()), "multiple snapshots are not consistent");
        const snapshotDeserializedAggregate = type.deserializeSnapshot(this._domainContext, snapshot);
        n_defensive_1.given(snapshotDeserializedAggregate, "snapshotDeserializedAggregate").ensureHasValue().ensureIsObject().ensureIsType(type);
        const snapshotDeserializedAggregateState = snapshotDeserializedAggregate.state;
        n_defensive_1.given(snapshotDeserializedAggregateState, "snapshotDeserializedAggregateState").ensureHasValue().ensureIsObject()
            .ensure(t => JSON.stringify(t) === JSON.stringify(this.state), "state is not consistent with original state");
    }
    applyEvent(event) {
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
    /**
     *
     * @deprecated DO NOT USE
     * @description override to trim retro events on the application of a new event
     */
    // protected trim(retroEvents: ReadonlyArray<DomainEvent<T>>): ReadonlyArray<DomainEvent<T>>
    // {
    //     given(retroEvents, "retroEvents").ensureHasValue().ensureIsArray().ensure(t => t.length > 0);
    //     return retroEvents;
    // }
    serializeForSnapshot(value) {
        if (value instanceof domain_object_1.DomainObject)
            return value.serialize();
        if (Object.keys(value).some(t => t.startsWith("_")))
            throw new n_exception_1.ApplicationException(`attempting to serialize an object [${value.getTypeName()}] with private fields but does not extend DomainObject for the purposes of snapshot`);
        return JSON.parse(JSON.stringify(value));
        // given(value, "value").ensureHasValue().ensureIsObject()
        //     .ensure(t => !!(<any>t).serialize, `serialize method is missing on type ${value.getTypeName()}`)
        //     .ensure(t => typeof ((<any>t).serialize) === "function", `property serialize on type ${value.getTypeName()} is not a function`);
        // return (<any>value).serialize();
    }
}
__decorate([
    n_util_1.serialize("$id"),
    __metadata("design:type", String),
    __metadata("design:paramtypes", [])
], AggregateRoot.prototype, "id", null);
__decorate([
    n_util_1.serialize("$events"),
    __metadata("design:type", Array),
    __metadata("design:paramtypes", [])
], AggregateRoot.prototype, "events", null);
__decorate([
    n_util_1.serialize("$version"),
    __metadata("design:type", Number),
    __metadata("design:paramtypes", [])
], AggregateRoot.prototype, "version", null);
__decorate([
    n_util_1.serialize("$createdAt"),
    __metadata("design:type", Number),
    __metadata("design:paramtypes", [])
], AggregateRoot.prototype, "createdAt", null);
__decorate([
    n_util_1.serialize("$updatedAt"),
    __metadata("design:type", Number),
    __metadata("design:paramtypes", [])
], AggregateRoot.prototype, "updatedAt", null);
exports.AggregateRoot = AggregateRoot;
//# sourceMappingURL=aggregate-root.js.map