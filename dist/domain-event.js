"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const n_defensive_1 = require("@nivinjoseph/n-defensive");
require("@nivinjoseph/n-ext");
const _1 = require(".");
class DomainEvent {
    constructor(data) {
        n_defensive_1.given(data, "data").ensureHasValue()
            .ensureHasStructure({
            $user: "string",
            "$name?": "string",
            "$occurredAt?": "number",
            "$version?": "number"
        });
        this._user = data.$user;
        this._name = this.getTypeName();
        this._occurredAt = data.$occurredAt || _1.DomainHelper.now;
        this._version = data.$version || 0;
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