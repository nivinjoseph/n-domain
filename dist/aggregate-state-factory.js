"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregateStateFactory = void 0;
const n_defensive_1 = require("@nivinjoseph/n-defensive");
const n_util_1 = require("@nivinjoseph/n-util");
class AggregateStateFactory {
    update(state) {
        (0, n_defensive_1.given)(state, "state").ensureHasValue().ensureIsObject();
        return state;
    }
    deserializeSnapshot(snapshot) {
        (0, n_defensive_1.given)(snapshot, "snapshot").ensureHasValue().ensureIsObject();
        const deserialized = {};
        Object.keys(snapshot).forEach(key => {
            const value = snapshot[key];
            if (value == null || typeof value !== "object") {
                deserialized[key] = value;
                return;
            }
            if (Array.isArray(value)) {
                deserialized[key] = value.map(v => {
                    if (v == null || typeof v !== "object" || !n_util_1.Deserializer.hasType(v.$typename))
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                        return v;
                    return n_util_1.Deserializer.deserialize(v);
                });
            }
            else {
                deserialized[key] = n_util_1.Deserializer.hasType(value.$typename)
                    ? n_util_1.Deserializer.deserialize(value) : value;
            }
        });
        return deserialized;
    }
    createDefaultAggregateState() {
        return {
            typeVersion: 1,
            id: null,
            version: null,
            createdAt: null,
            updatedAt: null
        };
    }
}
exports.AggregateStateFactory = AggregateStateFactory;
//# sourceMappingURL=aggregate-state-factory.js.map