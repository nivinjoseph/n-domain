import { AggregateState } from "./aggregate-state";


export abstract class AggregateStateFactory<T extends AggregateState>
{
    public abstract create(): T;
    public abstract update(state: T): T;
    
    protected createDefaultAggregateState(): AggregateState
    {
        return {
            typeVersion: 1,
            id: null as any,
            version: null as any,
            createdAt: null as any,
            updatedAt: null as any,
        };
    }
}