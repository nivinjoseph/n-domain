import { AggregateState } from "./aggregate-state";
export declare class AggregateStateHelper {
    static serializeStateIntoSnapshot(state: object, ...cloneKeys: ReadonlyArray<string>): object;
    static deserializeSnapshotIntoState(snapshot: object): object;
    static rebaseState<T extends AggregateState>(state: T, defaultState: object, rebaseState: object, rebaseVersion: number): void;
    private static _serializeForSnapshot;
}
//# sourceMappingURL=aggregate-state-helper.d.ts.map