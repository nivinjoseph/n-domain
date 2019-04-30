import { AggregateStateFactory } from "../../src/aggregate-state-factory";
import { AggregateState } from "../../src/aggregate-state";
import { given } from "@nivinjoseph/n-defensive";


export interface TodoState extends AggregateState
{
    title: string;
    description: string | null;
    isCompleted: boolean;
}


export class TodoStateFactory extends AggregateStateFactory<TodoState>
{
    public create(): TodoState
    {
        return {
            ...this.createDefaultAggregateState(),
            title: null as any,
            description: null,
            isCompleted: false
        };
    }   
    
    public update(state: TodoState): TodoState
    {
        given(state, "state").ensureHasValue().ensureIsObject();
        
        return state;
    }
    
    public deserializeSnapshot(snapshot: TodoState): TodoState
    {
        given(snapshot, "snapshot").ensureHasValue().ensureIsObject();
        
        return snapshot;
    }
}