import { AggregateState } from "./aggregate-state.js";
export declare class AggregateStateHelper {
    static serializeStateIntoSnapshot(state: object, ...cloneKeys: ReadonlyArray<string>): object;
    static deserializeSnapshotIntoState(snapshot: object): object;
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