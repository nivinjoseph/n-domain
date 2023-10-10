import { TodoState } from "../todo-state";
import { given } from "@nivinjoseph/n-defensive";
import { DomainEvent, DomainEventData } from "../../../src";
import { serialize } from "@nivinjoseph/n-util";
import { TodoDescription } from "../value-objects/todo-description";


export class TodoDescriptionUpdated extends DomainEvent<TodoState>
{
    private readonly _description: TodoDescription | null;
    
    @serialize
    public get description(): TodoDescription | null { return this._description; }


    public constructor(data: EventData)
    {
        super(data);

        const { description } = data;
        
        given(description, "description").ensureIsType(TodoDescription);
        this._description = description;
    }


    // public static deserializeEvent(data: DomainEventData & Serialized): TodoDescriptionUpdated
    // {
    //     given(data, "data").ensureHasValue().ensureIsObject();

    //     return new TodoDescriptionUpdated(data, data.description);
    // }


    // protected serializeEvent(): Serialized
    // {
    //     return {
    //         description: this._description
    //     };
    // }

    protected applyEvent(state: TodoState): void
    {
        state.description = this._description;
    }
}


interface EventData extends DomainEventData
{
    description: TodoDescription | null;
}