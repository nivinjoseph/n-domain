import { AggregateState } from "../../src/aggregate-state.js";
import { AggregateStateFactory } from "../../src/aggregate-state-factory.js";
import { TodoDescription } from "./value-objects/todo-description.js";


export interface TodoState extends AggregateState
{
    title: string;
    description: TodoDescription | null;
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
    
    // public update(state: TodoState): TodoState
    // {
    //     given(state, "state").ensureHasValue().ensureIsObject();
        
    //     return state;
    // }
    
    // public deserializeSnapshot(snapshot: TodoState): TodoState
    // {
    //     given(snapshot, "snapshot").ensureHasValue().ensureIsObject();

    //     return snapshot;
    // }
}


/**
 * Simulates a breaking shape change: create() is now at typeVersion 2, but no
 * migration is provided in update(). Loading a typeVersion 1 snapshot through
 * this factory should make the AggregateRoot constructor throw.
 */
export class UnmigratedTodoStateFactory extends TodoStateFactory
{
    public override create(): TodoState
    {
        const state = super.create();
        // typeVersion is readonly by design; bumping it is the deliberate signal of a shape change
        (state as { typeVersion: number; }).typeVersion = 2;
        return state;
    }
}


/**
 * Simulates the same breaking shape change as UnmigratedTodoStateFactory, but with
 * a migration in update() that brings a typeVersion 1 snapshot forward to 2.
 */
export class MigratedTodoStateFactory extends TodoStateFactory
{
    public override create(): TodoState
    {
        const state = super.create();
        (state as { typeVersion: number; }).typeVersion = 2;
        return state;
    }

    public override update(state: TodoState): TodoState
    {
        if (state.typeVersion === 1)
            (state as { typeVersion: number; }).typeVersion = 2;

        return state;
    }
}