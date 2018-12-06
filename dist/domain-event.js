"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const n_defensive_1 = require("@nivinjoseph/n-defensive");
require("@nivinjoseph/n-ext");
const _1 = require(".");
const n_exception_1 = require("@nivinjoseph/n-exception");
class DomainEvent {
    constructor(data) {
        n_defensive_1.given(data, "data").ensureHasValue()
            .ensureHasStructure({
            "$aggregateId?": "string",
            "$id?": "string",
            "$user?": "string",
            "$name?": "string",
            "$occurredAt?": "number",
            "$version?": "number",
            "$isCreatedEvent?": "boolean"
        });
        this._aggregateId = data.$aggregateId || null;
        this._id = data.$id || _1.DomainHelper.generateId();
        this._user = data.$user && !data.$user.isEmptyOrWhiteSpace() ? data.$user.trim() : null;
        this._name = this.getTypeName();
        this._occurredAt = data.$occurredAt || _1.DomainHelper.now;
        this._version = data.$version || 0;
        this._isCreatedEvent = !!data.$isCreatedEvent;
    }
    get aggregateId() { return this._aggregateId; }
    get id() { return this._id; }
    get user() { return this._user; }
    get name() { return this._name; }
    get occurredAt() { return this._occurredAt; }
    get version() { return this._version; }
    get isCreatedEvent() { return this._isCreatedEvent; }
    apply(aggregate, domainContext, state) {
        n_defensive_1.given(aggregate, "aggregate").ensureHasValue().ensureIsObject().ensure(t => t instanceof _1.AggregateRoot);
        n_defensive_1.given(domainContext, "domainContext").ensureHasValue().ensureHasStructure({ user: "string" });
        n_defensive_1.given(state, "state").ensureHasValue().ensureIsObject();
        if (this._user == null)
            this._user = domainContext.user;
        this._version = state.version || 0;
        this.applyEvent(state);
        if (this._aggregateId != null && this._aggregateId !== aggregate.id)
            throw new n_exception_1.ApplicationException(`Event of type '${this._name}' with id ${this._id} and aggregateId '${this._aggregateId}' is being applied on Aggregate of type '${aggregate.getTypeName()}' with id '${aggregate.id}'`);
        this._aggregateId = aggregate.id;
        state.version = this._version + 1;
    }
    serialize() {
        return Object.assign(this.serializeEvent(), {
            $aggregateId: this._aggregateId,
            $id: this._id,
            $user: this._user,
            $name: this._name,
            $occurredAt: this._occurredAt,
            $version: this._version,
            $isCreatedEvent: this._isCreatedEvent
        });
    }
}
exports.DomainEvent = DomainEvent;
//# sourceMappingURL=domain-event.js.map