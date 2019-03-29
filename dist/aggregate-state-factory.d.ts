import { AggregateState } from "./aggregate-state";
export declare abstract class AggregateStateFactory<T extends AggregateState> {
    abstract create(): T;
    abstract update(state: T): T;
    protected createDefaultAggregateState(): AggregateState;
}
