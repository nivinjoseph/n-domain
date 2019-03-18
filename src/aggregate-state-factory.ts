import { AggregateState } from "../dist";


export interface AggregateStateFactory<T extends AggregateState>
{
    create(): T;
    update(state: T): T;
}