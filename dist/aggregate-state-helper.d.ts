import { AggregateState } from "./aggregate-state.js";
export declare class AggregateStateHelper {
    /**
     * Serializes a state object into a plain snapshot: nested `Serializable`s (DomainObjects) are
     * serialized, while keys named in `cloneKeys` are deep-cloned via JSON instead. State values
     * must be primitives, arrays, plain JSON objects, or `Serializable`s — a non-`Serializable`
     * object with private (`_`-prefixed) fields throws.
     */
    static serializeStateIntoSnapshot(state: object, ...cloneKeys: ReadonlyArray<string>): object;
    /**
     * Revives a snapshot back into state: any object carrying a registered `$typename` is
     * deserialized into its `Serializable` class; everything else passes through unchanged.
     */
    static deserializeSnapshotIntoState(snapshot: object): object;
    /**
     * Layers a rebase snapshot over the current factory defaults onto `state` and stamps
     * `isRebased`/`rebasedFromVersion`. Call this from your rebased event's `applyEvent`,
     * forwarding the three values `AggregateRoot.rebase` hands to its event factory function —
     * without this call a rebase event has no effect on state.
     */
    static rebaseState<T extends AggregateState>(state: T, defaultState: object, rebaseState: object, rebaseVersion: number): void;
    /**
     * Produces a stable SHA-512 fingerprint of a state object (typically a factory's create() output).
     * The state is serialized into snapshot form and its keys are canonically (recursively) sorted before
     * hashing, so benign source-order changes do not trip the guard — only key-set or value changes do.
     * Intended for a drift guard: persist the fingerprint of create() in source control and fail a test when
     * it changes unexpectedly, since changing a create() default silently rewrites historical state on replay.
     */
    static fingerprintState(state: object): string;
    private static _canonicalize;
    private static _serializeForSnapshot;
}
//# sourceMappingURL=aggregate-state-helper.d.ts.map