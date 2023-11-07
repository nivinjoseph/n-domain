"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainEvent = void 0;
const tslib_1 = require("tslib");
const n_defensive_1 = require("@nivinjoseph/n-defensive");
const _1 = require(".");
const n_exception_1 = require("@nivinjoseph/n-exception");
const n_util_1 = require("@nivinjoseph/n-util");
// public
class DomainEvent extends n_util_1.Serializable {
    // occurredAt is epoch milliseconds
    constructor(data) {
        super(data);
        const { $aggregateId, $id, $userId, $name, $occurredAt, $version, $isCreatedEvent } = data;
        (0, n_defensive_1.given)($aggregateId, "$aggregateId").ensureIsString();
        this._aggregateId = $aggregateId || null;
        (0, n_defensive_1.given)($id, "$id").ensureIsString();
        this._id = $id || null;
        (0, n_defensive_1.given)($userId, "$userId").ensureIsString();
        this._userId = $userId && !$userId.isEmptyOrWhiteSpace() ? $userId.trim() : null;
        this._name = this.getTypeName();
        if ($name && $name !== this._name)
            throw new n_exception_1.ApplicationException(`Deserialized event name '${$name}' does not match target type name '${this._name}'.`);
        (0, n_defensive_1.given)($occurredAt, "$occurredAt").ensureIsNumber();
        this._occurredAt = $occurredAt || _1.DomainHelper.now;
        (0, n_defensive_1.given)($version, "$version").ensureIsNumber().ensure(t => t > 0);
        this._version = $version || 0;
        (0, n_defensive_1.given)($isCreatedEvent, "$isCreatedEvent").ensureIsBoolean();
        this._isCreatedEvent = !!$isCreatedEvent;
    }
    get aggregateId() {
        (0, n_defensive_1.given)(this, "this").ensure(t => t._aggregateId != null, "accessing property before apply");
        return this._aggregateId;
    }
    get id() {
        (0, n_defensive_1.given)(this, "this").ensure(t => t._id != null, "accessing property before apply");
        return this._id;
    }
    get userId() {
        (0, n_defensive_1.given)(this, "this").ensure(t => t._userId != null, "accessing property before apply");
        return this._userId;
    }
    get name() { return this._name; }
    get partitionKey() { return this.aggregateId; }
    get refId() { return this.aggregateId; }
    get occurredAt() { return this._occurredAt; }
    get version() { return this._version; }
    get isCreatedEvent() { return this._isCreatedEvent; }
    apply(aggregate, domainContext, state) {
        (0, n_defensive_1.given)(aggregate, "aggregate").ensureHasValue().ensureIsObject().ensure(t => t instanceof _1.AggregateRoot);
        (0, n_defensive_1.given)(domainContext, "domainContext").ensureHasValue().ensureHasStructure({ userId: "string" });
        (0, n_defensive_1.given)(state, "state").ensureHasValue().ensureIsObject();
        if (this._userId == null)
            this._userId = domainContext.userId || "UNKNOWN";
        const version = this._version || (state.version + 1) || 1;
        this.applyEvent(state);
        if (this._isCreatedEvent)
            state.createdAt = this._occurredAt;
        state.updatedAt = this._occurredAt;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (aggregate.id == null)
            throw new n_exception_1.ApplicationException("Created event is not setting the id of the aggregate");
        if (this._aggregateId != null && this._aggregateId !== aggregate.id)
            throw new n_exception_1.ApplicationException(`Event of type '${this._name}' with id ${this._id} and aggregateId '${this._aggregateId}' is being applied on Aggregate of type '${aggregate.getTypeName()}' with id '${aggregate.id}'`);
        this._aggregateId = aggregate.id;
        state.version = this._version = version;
        const id = `${this._aggregateId}-${this._version}`;
        if (this._id != null && this._id !== id)
            throw new n_exception_1.ApplicationException(`Deserialized id '${this._id}' does not match computed id ${id}`);
        this._id = id;
    }
}
tslib_1.__decorate([
    (0, n_util_1.serialize)("$aggregateId"),
    tslib_1.__metadata("design:type", String),
    tslib_1.__metadata("design:paramtypes", [])
], DomainEvent.prototype, "aggregateId", null);
tslib_1.__decorate([
    (0, n_util_1.serialize)("$id"),
    tslib_1.__metadata("design:type", String),
    tslib_1.__metadata("design:paramtypes", [])
], DomainEvent.prototype, "id", null);
tslib_1.__decorate([
    (0, n_util_1.serialize)("$userId"),
    tslib_1.__metadata("design:type", String),
    tslib_1.__metadata("design:paramtypes", [])
], DomainEvent.prototype, "userId", null);
tslib_1.__decorate([
    (0, n_util_1.serialize)("$name"),
    tslib_1.__metadata("design:type", String),
    tslib_1.__metadata("design:paramtypes", [])
], DomainEvent.prototype, "name", null);
tslib_1.__decorate([
    (0, n_util_1.serialize)("$occurredAt"),
    tslib_1.__metadata("design:type", Number),
    tslib_1.__metadata("design:paramtypes", [])
], DomainEvent.prototype, "occurredAt", null);
tslib_1.__decorate([
    (0, n_util_1.serialize)("$version"),
    tslib_1.__metadata("design:type", Number),
    tslib_1.__metadata("design:paramtypes", [])
], DomainEvent.prototype, "version", null);
tslib_1.__decorate([
    (0, n_util_1.serialize)("$isCreatedEvent"),
    tslib_1.__metadata("design:type", Boolean),
    tslib_1.__metadata("design:paramtypes", [])
], DomainEvent.prototype, "isCreatedEvent", null);
exports.DomainEvent = DomainEvent;
//# sourceMappingURL=domain-event.js.map