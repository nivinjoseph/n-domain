"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregateStateFactory = void 0;
const n_defensive_1 = require("@nivinjoseph/n-defensive");
const aggregate_state_helper_1 = require("./aggregate-state-helper");
class AggregateStateFactory {
    update(state) {
        (0, n_defensive_1.given)(state, "state").ensureHasValue().ensureIsObject();
        return state;
    }
    deserializeSnapshot(snapshot) {
        // given(snapshot, "snapshot").ensureHasValue().ensureIsObject();
        // const deserialized: Record<string, any> = {};
        // Object.keys(snapshot).forEach(key =>
        // {
        //     const value = (snapshot as any)[key];
        //     if (value == null || typeof value !== "object")
        //     {
        //         deserialized[key] = value;
        //         return;
        //     }
        //     if (Array.isArray(value))
        //     {
        //         deserialized[key] = value.map(v =>
        //         {
        //             if (v == null || typeof v !== "object" || !Deserializer.hasType(v.$typename))
        //                 // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        //                 return v;
        //             return Deserializer.deserialize(v);
        //         });
        //     }
        //     else
        //     {
        //         deserialized[key] = Deserializer.hasType(value.$typename)
        //             ? Deserializer.deserialize(value) : value;
        //     }
        // });
        // return deserialized as T;
        return aggregate_state_helper_1.AggregateStateHelper.deserializeSnapshotIntoState(snapshot);
    }
    createDefaultAggregateState() {
        return {
            typeVersion: 1,
            id: null,
            version: null,
            createdAt: null,
            updatedAt: null,
            isRebased: false,
            rebasedFromVersion: 0
        };
    }
}
exports.AggregateStateFactory = AggregateStateFactory;
//# sourceMappingURL=aggregate-state-factory.js.map