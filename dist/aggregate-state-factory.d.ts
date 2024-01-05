import { AggregateState } from "./aggregate-state.js";
export declare abstract class AggregateStateFactory<T extends AggregateState> {
    abstract create(): T;
    update(state: T): T;
    deserializeSnapshot(snapshot: T): T;
    protected createDefaultAggregateState(): AggregateState;
}
//# sourceMappingURL=aggregate-state-factory.d.ts.map