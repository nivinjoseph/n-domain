"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const n_defensive_1 = require("@nivinjoseph/n-defensive");
const n_exception_1 = require("@nivinjoseph/n-exception");
require("@nivinjoseph/n-ext");
class AggregateRoot {
    constructor(events) {
        this._state = {};
        this._currentEvents = new Array();
        n_defensive_1.given(events, "events").ensureHasValue().ensureIsArray().ensure(t => t.length > 0);
        this._retroEvents = events;
        this._retroEvents.orderBy(t => t.version).forEach(t => t.apply(this._state));
        this._retroVersion = this.currentVersion;
    }
    get id() { return this._state.id; }
    get retroEvents() { return this._retroEvents.orderBy(t => t.version); }
    get retroVersion() { return this._retroVersion; }
    get currentEvents() { return this._currentEvents.orderBy(t => t.version); }
    get currentVersion() { return this._state.version; }
    get events() { return [...this._retroEvents, ...this._currentEvents].orderBy(t => t.version); }
    get version() { return this.currentVersion; }
    get updatedAt() { return this.events.orderByDesc(t => t.version)[0].occurredAt; }
    get state() { return this._state; }
    static deserialize(aggregateType, eventTypes, data) {
        n_defensive_1.given(aggregateType, "aggregateType").ensureHasValue().ensureIsFunction();
        n_defensive_1.given(eventTypes, "eventTypes").ensureHasValue().ensureIsArray().ensure(t => t.length > 0);
        n_defensive_1.given(data, "data").ensureHasValue().ensureIsObject()
            .ensureHasStructure({
            $id: "string",
            $version: "number",
            $createdAt: "number",
            $updatedAt: "number",
            $state: "object",
            $events: [{
                    $name: "string",
                    $occurredAt: "number",
                    $version: "number"
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
        return new aggregateType(events);
    }
    serialize() {
        return {
            $id: this.id,
            $version: this.version,
            $createdAt: this.createdAt,
            $updatedAt: this.updatedAt,
            $state: this.state,
            $events: this.events.map(t => t.serialize())
        };
    }
    applyEvent(event) {
        event.apply(this._state);
        this._currentEvents.push(event);
    }
}
exports.AggregateRoot = AggregateRoot;
//# sourceMappingURL=aggregate-root.js.map