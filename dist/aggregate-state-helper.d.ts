export declare class AggregateStateHelper {
    static serializeStateIntoSnapshot(state: object, ...cloneKeys: ReadonlyArray<string>): object;
    static deserializeSnapshotIntoState(snapshot: object): object;
    private static _serializeForSnapshot;
}
//# sourceMappingURL=aggregate-state-helper.d.ts.map