import { AggregateStateFactory } from "../../src/aggregate-state-factory";
import { AggregateState } from "../../src/aggregate-state";
import { DomainHelper } from "../../src/domain-helper";


export interface TodoState extends AggregateState
{
    title: string;
    description: string | null;
    isCompleted: boolean;
}


export class TodoStateFactory implements AggregateStateFactory<TodoState>
{
    public create(): TodoState
    {
        return {
            ...DomainHelper.createDefaultAggregateState(),
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