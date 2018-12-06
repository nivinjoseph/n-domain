"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const n_defensive_1 = require("@nivinjoseph/n-defensive");
const n_exception_1 = require("@nivinjoseph/n-exception");
require("@nivinjoseph/n-ext");
class AggregateRoot {
    constructor(domainContext, events, initialState) {
        this._currentEvents = new Array();
        n_defensive_1.given(domainContext, "domainContext").ensureHasValue()
            .ensureHasStructure({ user: "string" });
        n_defensive_1.given(events, "events").ensureHasValue().ensureIsArray()
            .ensure(t => t.length > 0, "no events passed")
            .ensure(t => t.some(u => u.isCreatedEvent), "no created event passed")
            .ensure(t => t.count(u => u.isCreatedEvent) === 1, "more than one created event passed");
        n_defensive_1.given(initialState, "initialState").ensureIsObject();
        this._domainContext = domainContext;
        this._state = initialState || {};
        this._retroEvents = events;
        this._retroEvents.orderBy(t => t.version).forEach(t => t.apply(this, this._domainContext, this._state));
        this._retroVersion = this.currentVersion;
    }
    get id() { return this._state.id; }
    get retroEvents() { return this._retroEvents.orderBy(t => t.version); }
    get retroVersion() { return this._retroVersion; }
    get currentEvents() { return this._currentEvents.orderBy(t => t.version); }
    get currentVersion() { return this._state.version; }
    get events() { return [...this._retroEvents, ...this._currentEvents].orderBy(t => t.version); }
    get version() { return this.currentVersion; }
    get createdAt() { return this.events.find(t => t.isCreatedEvent).occurredAt; }
    get updatedAt() { return this.events.orderByDesc(t => t.version)[0].occurredAt; }
    get hasChanges() { return this.currentVersion !== this.retroVersion; }
    get context() { return this._domainContext; }
    get state() { return this._state; }
    static deserialize(domainContext, aggregateType, eventTypes, data) {
        n_defensive_1.given(domainContext, "domainContext").ensureHasValue().ensureHasStructure({ user: "string" });
        n_defensive_1.given(aggregateType, "aggregateType").ensureHasValue().ensureIsFunction();
        n_defensive_1.given(eventTypes, "eventTypes").ensureHasValue().ensureIsArray()
            .ensure(t => t.length > 0, "no eventTypes provided")
            .ensure(t => t.map(u => u.getTypeName()).distinct().length === t.length, "duplicate event types detected");
        n_defensive_1.given(data, "data").ensureHasValue().ensureIsObject()
            .ensureHasStructure({
            $id: "string",
            $version: "number",
            $createdAt: "number",
            $updatedAt: "number",
            $events: [{
                    $aggregateId: "string",
                    $id: "string",
                    $user: "string",
                    $name: "string",
                    $occurredAt: "number",
                    $version: "number",
                    $isCreatedEvent: "boolean"
                }]
        });
        const events = data.$events.map((eventData) => {
            const name = eventData.$name;
            const event = eventTypes.find(t => t.getTypeName() === name);
            if (!event)
                throw new n_exception_1.ApplicationException(`No event type supplied for event with name '${name}'`);
            if (!event.deserializeEvent)
                throw new n_exception_1.ApplicationException(`Event type '${name}' does not have a static deserializeEvent method defined.`);
            return event.deserializeEvent(eventData);
        });
        return new aggregateType(domainContext, events);
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
    constructVersion(version) {
        n_defensive_1.given(version, "version").ensureHasValue().ensureIsNumber()
            .ensure(t => t > 0 && t <= this.version, `version must be > 0 and <= ${this.version} (current version)`);
        const ctor = this.constructor;
        return new ctor(this._domainContext, this.events.filter(t => t.version < version));
    }
    applyEvent(event) {
        event.apply(this, this._domainContext, this._state);
        this._currentEvents.push(event);
    }
    hasEventOfType(eventType) {
        n_defensive_1.given(eventType, "eventType").ensureHasValue().ensureIsFunction();
        const eventTypeName = eventType.getTypeName();
        return this.events.some(t => t.name === eventTypeName);
    }
    getEventsOfType(eventType) {
        n_defensive_1.given(eventType, "eventType").ensureHasValue().ensureIsFunction();
        const eventTypeName = eventType.getTypeName();
        return this.events.filter(t => t.name === eventTypeName);
    }
}
exports.AggregateRoot = AggregateRoot;
//# sourceMappingURL=aggregate-root.js.map