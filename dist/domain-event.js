"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const n_defensive_1 = require("@nivinjoseph/n-defensive");
require("@nivinjoseph/n-ext");
class DomainEvent {
    constructor(user, occurredAt, version) {
        n_defensive_1.given(user, "user").ensureHasValue().ensureIsString();
        this._user = user;
        this._name = this.getTypeName();
        n_defensive_1.given(occurredAt, "occurredAt").ensureHasValue().ensureIsNumber().ensure(t => t > 0);
        this._occurredAt = occurredAt;
        n_defensive_1.given(version, "version").ensureIsNumber().ensure(t => t >= 0);
        this._version = version;
    }
    get user() { return this._user; }
    get name() { return this._name; }
    get occurredAt() { return this._occurredAt; }
    get version() { return this._version; }
    apply(state) {
        n_defensive_1.given(state, "state").ensureHasValue().ensureIsObject();
        this._version = state.version || 0;
        this.applyEvent(state);
        state.version = this._version + 1;
    }
    serialize() {
        return Object.assign(this.serializeEvent(), {
            $user: this._user,
            $name: this._name,
            $occurredAt: this._occurredAt,
            $version: this._version
        });
    }
}
exports.DomainEvent = DomainEvent;
//# sourceMappingURL=domain-event.js.map