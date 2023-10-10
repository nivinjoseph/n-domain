"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregateRebased = void 0;
const tslib_1 = require("tslib");
const n_defensive_1 = require("@nivinjoseph/n-defensive");
const n_util_1 = require("@nivinjoseph/n-util");
const domain_event_1 = require("./domain-event");
class AggregateRebased extends domain_event_1.DomainEvent {
    constructor(data) {
        super(data);
        const { defaultState, rebaseState, rebaseVersion } = data;
        (0, n_defensive_1.given)(defaultState, "defaultState").ensureHasValue().ensureIsObject();
        this._defaultState = defaultState;
        (0, n_defensive_1.given)(rebaseState, "rebaseState").ensureHasValue().ensureIsObject();
        this._rebaseState = rebaseState;
        (0, n_defensive_1.given)(rebaseVersion, "rebaseVersion").ensureHasValue().ensureIsNumber()
            .ensure(t => t > 0);
        this._rebaseVersion = rebaseVersion;
    }
    get defaultState() { return this._defaultState; }
    get rebaseState() { return this._rebaseState; }
    get rebaseVersion() { return this._rebaseVersion; }
    applyEvent(state) {
        (0, n_defensive_1.given)(state, "state").ensureHasValue().ensureIsObject();
        // current factory generated default state
        // layer base state on top of it
        // layer the above result on top of current state
        // console.dir(state);
        // console.dir(this._defaultState);
        // console.dir(this._rebaseState);
        Object.assign(state, this._defaultState, this._rebaseState);
        state.isRebased = true;
        state.rebasedFromVersion = this._rebaseVersion;
        // console.dir(state);
    }
}
tslib_1.__decorate([
    n_util_1.serialize,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], AggregateRebased.prototype, "defaultState", null);
tslib_1.__decorate([
    n_util_1.serialize,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], AggregateRebased.prototype, "rebaseState", null);
tslib_1.__decorate([
    n_util_1.serialize,
    tslib_1.__metadata("design:type", Number),
    tslib_1.__metadata("design:paramtypes", [])
], AggregateRebased.prototype, "rebaseVersion", null);
exports.AggregateRebased = AggregateRebased;
//# sourceMappingURL=aggregate-rebased.js.map