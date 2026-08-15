import { AggregateState } from "./aggregate-state.js";
/**
 * Owns an aggregate's default state, `typeVersion` migrations, and snapshot deserialization.
 * Stateless — one instance can be shared/reused freely (unlike `OrgAggregateStateFactory`).
 *
 * @typeParam T - the state interface this factory produces
 */
export declare abstract class AggregateStateFactory<T extends AggregateState> {
    /**
     * Produces the default state. Must be **deterministic** — identical output on every call (no
     * `Date.now()`, no id generation); `AggregateRoot.test()` verifies this. Spread
     * `createDefaultAggregateState()` into the result, and on a breaking state-shape change,
     * override `typeVersion` after the spread (and migrate older state in `update()`).
     */
    abstract create(): T;
    /**
     * Hook for migrating loaded state forward across `typeVersion`s; the default is identity.
     * The `AggregateRoot` constructor runs every loaded state through this and throws if the
     * result's `typeVersion` does not match the current `create()` output. `typeVersion` is
     * declared readonly, so migrations bump it via a cast: `(state as { typeVersion: number }).typeVersion = 2`.
     */
    update(state: T): T;
    /**
     * Revives serialized value objects (registered `Serializable`s carrying `$typename`) inside a
     * snapshot back into class instances.
     */
    deserializeSnapshot(snapshot: T): T;
    /**
     * Base-field defaults (`typeVersion: 1`, `isRebased: false`, etc.); spread this into your
     * `create()` output before your aggregate-specific fields.
     */
    protected createDefaultAggregateState(): AggregateState;
}
//# sourceMappingURL=aggregate-state-factory.d.ts.map