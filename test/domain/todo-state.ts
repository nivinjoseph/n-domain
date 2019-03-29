import { AggregateStateFactory } from "../../src/aggregate-state-factory";
import { AggregateState } from "../../src/aggregate-state";


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
        return state;
    }   
}