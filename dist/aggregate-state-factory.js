import { given } from "@nivinjoseph/n-defensive";
import { AggregateStateHelper } from "./aggregate-state-helper.js";
/**
 * Owns an aggregate's default state, `typeVersion` migrations, and snapshot deserialization.
 * Stateless — one instance can be shared/reused freely (unlike `OrgAggregateStateFactory`).
 *
 * @typeParam T - the state interface this factory produces
 */
export class AggregateStateFactory {
    /**
     * Hook for migrating loaded state forward across `typeVersion`s; the default is identity.
     * The `AggregateRoot` constructor runs every loaded state through this and throws if the
     * result's `typeVersion` does not match the current `create()` output. `typeVersion` is
     * declared readonly, so migrations bump it via a cast: `(state as { typeVersion: number }).typeVersion = 2`.
     */
    update(state) {
        given(state, "state").ensureHasValue().ensureIsObject();
        return state;
    }
    /**
     * Revives serialized value objects (registered `Serializable`s carrying `$typename`) inside a
     * snapshot back into class instances.
     */
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
        return AggregateStateHelper.deserializeSnapshotIntoState(snapshot);
    }
    /**
     * Base-field defaults (`typeVersion: 1`, `isRebased: false`, etc.); spread this into your
     * `create()` output before your aggregate-specific fields.
     */
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
//# sourceMappingURL=aggregate-state-factory.js.map