import { AggregateState } from "./aggregate-state";
export interface AggregateStateFactory<T extends AggregateState> {
    create(): T;
    update(state: T): T;
}
