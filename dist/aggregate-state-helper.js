"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregateStateHelper = void 0;
const n_defensive_1 = require("@nivinjoseph/n-defensive");
const n_exception_1 = require("@nivinjoseph/n-exception");
const n_util_1 = require("@nivinjoseph/n-util");
const domain_object_1 = require("./domain-object");
class AggregateStateHelper {
    static serializeStateIntoSnapshot(state, ...cloneKeys) {
        const snapshot = Object.assign({}, state);
        Object.keys(snapshot).forEach(key => {
            const val = snapshot[key];
            if (val && typeof val === "object") {
                if (cloneKeys.contains(key)) {
                    snapshot[key] = JSON.parse(JSON.stringify(val));
                    return;
                }
                if (Array.isArray(val))
                    snapshot[key] = val.map(t => {
                        if (typeof t === "object")
                            return this._serializeForSnapshot(t);
                        else
                            return t;
                    });
                else
                    snapshot[key] = this._serializeForSnapshot(val);
            }
        });
        return snapshot;
    }
    static deserializeSnapshotIntoState(snapshot) {
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
    static _serializeForSnapshot(value) {
        if (value instanceof domain_object_1.DomainObject)
            return value.serialize();
        if (Object.keys(value).some(t => t.startsWith("_")))
            throw new n_exception_1.ApplicationException(`attempting to serialize an object [${value.getTypeName()}] with private fields but does not extend DomainObject for the purposes of snapshot`);
        return JSON.parse(JSON.stringify(value));
        // given(value, "value").ensureHasValue().ensureIsObject()
        //     .ensure(t => !!(<any>t).serialize, `serialize method is missing on type ${value.getTypeName()}`)
        //     .ensure(t => typeof ((<any>t).serialize) === "function", `property serialize on type ${value.getTypeName()} is not a function`);
        // return (<any>value).serialize();
    }
}
exports.AggregateStateHelper = AggregateStateHelper;
//# sourceMappingURL=aggregate-state-helper.js.map