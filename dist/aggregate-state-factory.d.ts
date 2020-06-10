import { AggregateState } from "./aggregate-state";
export declare abstract class AggregateStateFactory<T extends AggregateState> {
    abstract create(): T;
    update(state: T): T;
    deserializeSnapshot(snapshot: T): T;
    protected createDefaultAggregateState(): AggregateState;
}
