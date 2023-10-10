export interface AggregateState {
    readonly typeVersion: number;
    id: string;
    version: number;
    createdAt: number;
    updatedAt: number;
    isRebased: boolean;
    rebasedFromVersion: number;
}
export declare function clearBaseState(state: AggregateState): void;
//# sourceMappingURL=aggregate-state.d.ts.map