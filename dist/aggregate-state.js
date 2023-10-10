"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearBaseState = void 0;
const n_defensive_1 = require("@nivinjoseph/n-defensive");
function clearBaseState(state) {
    (0, n_defensive_1.given)(state, "state").ensureHasValue().ensureIsObject();
    // @ts-expect-error: deliberate
    delete state.typeVersion;
    // @ts-expect-error: deliberate
    delete state.id;
    // @ts-expect-error: deliberate
    delete state.version;
    // @ts-expect-error: deliberate
    delete state.createdAt;
    // @ts-expect-error: deliberate
    delete state.updatedAt;
    // @ts-expect-error: deliberate
    delete state.isRebased;
    // @ts-expect-error: deliberate
    delete state.rebasedFromVersion;
}
exports.clearBaseState = clearBaseState;
//# sourceMappingURL=aggregate-state.js.map