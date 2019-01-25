"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const n_defensive_1 = require("@nivinjoseph/n-defensive");
const n_exception_1 = require("@nivinjoseph/n-exception");
require("@nivinjoseph/n-ext");
class AggregateRoot {
    constructor(domainContext, events, initialState) {
        this._currentEvents = new Array();
        this._isNew = false;
        n_defensive_1.given(domainContext, "domainContext").ensureHasValue()
            .ensureHasStructure({ userId: "string" });
        this._domainContext = domainContext;
        n_defensive_1.given(initialState, "initialState").ensureIsObject();
        this._state = initialState || {};
        if (this._state.version) {
            n_defensive_1.given(events, "events").ensureHasValue().ensureIsArray()
                .ensure(t => t.length === 0, "no events should be passed when constructing from snapshot");
            this._retroEvents = [];
        }
        else {
            n_defensive_1.given(events, "events").ensureHasValue().ensureIsArray()
                .ensure(t => t.length > 0, "no events passed")
                .ensure(t => t.some(u => u.isCreatedEvent), "no created event passed")
                .ensure(t => t.count(u => u.isCreatedEvent) === 1, "more than one created event passed");
            this._retroEvents = events;
            if (this._retroEvents.some(t => t.aggregateId == null))
                this._isNew = true;
            this._retroEvents.orderBy(t => t.version).forEach(t => t.apply(this, this._domainContext, this._state));
        }
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
    get isNew() { return this._isNew; }
    get hasChanges() { return this.currentVersion !== this.retroVersion; }
    get context() { return this._domainContext; }
    get state() { return this._state; }
    static deserializeFromEvents(domainContext, aggregateType, eventTypes, eventData) {
        n_defensive_1.given(domainContext, "domainContext").ensureHasValue().ensureHasStructure({ userId: "string" });
        n_defensive_1.given(aggregateType, "aggregateType").ensureHasValue().ensureIsFunction();
        n_defensive_1.given(eventTypes, "eventTypes").ensureHasValue().ensureIsArray()
            .ensure(t => t.length > 0, "no eventTypes provided")
            .ensure(t => t.map(u => u.getTypeName()).distinct().length === t.length, "duplicate event types detected");
        n_defensive_1.given(eventData, "eventData").ensureHasValue().ensureIsArray().ensure(t => t.length > 0);
        const deserializedEvents = eventData.map((eventData) => {
            const name = eventData.$name;
            const event = eventTypes.find(t => t.getTypeName() === name);
            if (!event)
                throw new n_exception_1.ApplicationException(`No event type supplied for event with name '${name}'`);
            if (!event.deserializeEvent)
                throw new n_exception_1.ApplicationException(`Event type '${name}' does not have a static deserializeEvent method defined.`);
            return event.deserializeEvent(eventData);
        });
        return new aggregateType(domainContext, deserializedEvents);
    }
    static deserializeFromSnapshot(domainContext, aggregateType, stateSnapshot) {
        n_defensive_1.given(domainContext, "domainContext").ensureHasValue().ensureHasStructure({ userId: "string" });
        n_defensive_1.given(aggregateType, "aggregateType").ensureHasValue().ensureIsFunction();
        n_defensive_1.given(stateSnapshot, "stateSnapshot").ensureHasValue().ensureIsObject()
            .ensureHasStructure({
            id: "string",
            version: "number",
            createdAt: "number",
            updatedAt: "number"
        });
        return new aggregateType(domainContext, [], stateSnapshot);
    }
    serialize() {
        return {
            $id: this.id,
            $version: this.version,
            $createdAt: this.createdAt,
            $updatedAt: this.updatedAt,
            $events: this.events.map(t => t.serialize())
        };
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
        n_defensive_1.given(this, "this").ensure(t => t.retroEvents.length > 0, "constructing version without retro events");
        const ctor = this.constructor;
        return new ctor(this._domainContext, this.events.filter(t => t.version <= version));
    }
    hasEventOfType(eventType) {
        n_defensive_1.given(eventType, "eventType").ensureHasValue().ensureIsFunction();
        const eventTypeName = eventType.getTypeName();
        return this.events.some(t => t.name === eventTypeName);
    }
    hasRetroEventOfType(eventType) {
        n_defensive_1.given(eventType, "eventType").ensureHasValue().ensureIsFunction();
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
        const eventTypeName = eventType.getTypeName();
        return this.events.filter(t => t.name === eventTypeName);
    }
    getRetroEventsOfType(eventType) {
        n_defensive_1.given(eventType, "eventType").ensureHasValue().ensureIsFunction();
        const eventTypeName = eventType.getTypeName();
        return this._retroEvents.filter(t => t.name === eventTypeName);
    }
    getCurrentEventsOfType(eventType) {
        n_defensive_1.given(eventType, "eventType").ensureHasValue().ensureIsFunction();
        const eventTypeName = eventType.getTypeName();
        return this._currentEvents.filter(t => t.name === eventTypeName);
    }
    applyEvent(event) {
        event.apply(this, this._domainContext, this._state);
        this._currentEvents.push(event);
        if (this._retroEvents.length > 0) {
            const trimmed = this.trim(this._retroEvents.orderBy(t => t.version)).orderBy(t => t.version);
            n_defensive_1.given(trimmed, "trimmed").ensureHasValue().ensureIsArray()
                .ensure(t => t.length > 0, "cannot trim all retro events")
                .ensure(t => t.length <= this._retroEvents.length, "only contraction is allowed")
                .ensure(t => t.some(u => u.isCreatedEvent), "cannot trim created event")
                .ensure(t => t.count(u => u.isCreatedEvent) === 1, "cannot add new created events")
                .ensure(t => t.every(u => this._retroEvents.contains(u)), "cannot add new events");
            this._retroEvents = trimmed;
        }
    }
    trim(retroEvents) {
        n_defensive_1.given(retroEvents, "retroEvents").ensureHasValue().ensureIsArray().ensure(t => t.length > 0);
        return retroEvents;
    }
    serializeForSnapshot(value) {
        n_defensive_1.given(value, "value").ensureHasValue().ensureIsObject()
            .ensure(t => !!t.serialize, `serialize method is missing on type ${value.getTypeName()}`)
            .ensure(t => typeof (t.serialize) === "function", `property serialize on type ${value.getTypeName()} is not a function`);
        return value.serialize();
    }
}
exports.AggregateRoot = AggregateRoot;
//# sourceMappingURL=aggregate-root.js.map