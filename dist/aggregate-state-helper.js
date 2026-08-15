import { given } from "@nivinjoseph/n-defensive";
import { ApplicationException } from "@nivinjoseph/n-exception";
import { Deserializer, Serializable } from "@nivinjoseph/n-util";
import { createHash } from "node:crypto";
export class AggregateStateHelper {
    /**
     * Serializes a state object into a plain snapshot: nested `Serializable`s (DomainObjects) are
     * serialized, while keys named in `cloneKeys` are deep-cloned via JSON instead. State values
     * must be primitives, arrays, plain JSON objects, or `Serializable`s — a non-`Serializable`
     * object with private (`_`-prefixed) fields throws.
     */
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
    /**
     * Revives a snapshot back into state: any object carrying a registered `$typename` is
     * deserialized into its `Serializable` class; everything else passes through unchanged.
     */
    static deserializeSnapshotIntoState(snapshot) {
        given(snapshot, "snapshot").ensureHasValue().ensureIsObject();
        const deserialized = {};
        Object.keys(snapshot).forEach(key => {
            const value = snapshot[key];
            if (value == null || typeof value !== "object") {
                deserialized[key] = value;
                return;
            }
            if (Array.isArray(value)) {
                deserialized[key] = value.map(v => {
                    if (v == null || typeof v !== "object" || !Deserializer.hasType(v.$typename))
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                        return v;
                    return Deserializer.deserialize(v);
                });
            }
            else {
                deserialized[key] = Deserializer.hasType(value.$typename)
                    ? Deserializer.deserialize(value) : value;
            }
        });
        return deserialized;
    }
    /**
     * Layers a rebase snapshot over the current factory defaults onto `state` and stamps
     * `isRebased`/`rebasedFromVersion`. Call this from your rebased event's `applyEvent`,
     * forwarding the three values `AggregateRoot.rebase` hands to its event factory function —
     * without this call a rebase event has no effect on state.
     */
    static rebaseState(state, defaultState, rebaseState, rebaseVersion) {
        given(state, "state").ensureHasValue().ensureIsObject();
        given(defaultState, "defaultState").ensureHasValue().ensureIsObject();
        given(rebaseState, "rebaseState").ensureHasValue().ensureIsObject();
        given(rebaseVersion, "rebaseVersion").ensureHasValue().ensureIsNumber().ensure(t => t > 0);
        // current factory generated default state
        // layer rebaseState state on top of it
        // layer the above result on top of current state
        defaultState = AggregateStateHelper.deserializeSnapshotIntoState(defaultState);
        rebaseState = AggregateStateHelper.deserializeSnapshotIntoState(rebaseState);
        // console.dir(state);
        // console.dir(defaultState);
        // console.dir(rebaseState);
        Object.assign(state, defaultState, rebaseState);
        state.isRebased = true;
        state.rebasedFromVersion = rebaseVersion;
        // console.dir(state);
    }
    /**
     * Produces a stable SHA-512 fingerprint of a state object (typically a factory's create() output).
     * The state is serialized into snapshot form and its keys are canonically (recursively) sorted before
     * hashing, so benign source-order changes do not trip the guard — only key-set or value changes do.
     * Intended for a drift guard: persist the fingerprint of create() in source control and fail a test when
     * it changes unexpectedly, since changing a create() default silently rewrites historical state on replay.
     */
    static fingerprintState(state) {
        given(state, "state").ensureHasValue().ensureIsObject();
        const snapshot = AggregateStateHelper.serializeStateIntoSnapshot(state);
        const canonical = AggregateStateHelper._canonicalize(snapshot);
        return createHash("sha512").update(JSON.stringify(canonical)).digest("hex").toUpperCase();
    }
    static _canonicalize(value) {
        if (value == null || typeof value !== "object")
            return value;
        if (Array.isArray(value))
            return value.map(t => AggregateStateHelper._canonicalize(t));
        const obj = value;
        const result = {};
        Object.keys(obj).sort().forEach(key => {
            result[key] = AggregateStateHelper._canonicalize(obj[key]);
        });
        return result;
    }
    static _serializeForSnapshot(value) {
        // DomainObject extends Serializable
        if (value instanceof Serializable)
            return value.serialize();
        if (Object.keys(value).some(t => t.startsWith("_")))
            throw new ApplicationException(`attempting to serialize an object [${value.getTypeName()}] with private fields but does not extend DomainObject for the purposes of snapshot`);
        return JSON.parse(JSON.stringify(value));
        // given(value, "value").ensureHasValue().ensureIsObject()
        //     .ensure(t => !!(<any>t).serialize, `serialize method is missing on type ${value.getTypeName()}`)
        //     .ensure(t => typeof ((<any>t).serialize) === "function", `property serialize on type ${value.getTypeName()} is not a function`);
        // return (<any>value).serialize();
    }
}
//# sourceMappingURL=aggregate-state-helper.js.map