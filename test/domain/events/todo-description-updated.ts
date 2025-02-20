import { given } from "@nivinjoseph/n-defensive";
import { serialize } from "@nivinjoseph/n-util";
import { DomainEventData } from "../../../src/index.js";
import { TodoState } from "../todo-state.js";
import { TodoDescription } from "../value-objects/todo-description.js";
import { TodoDomainEvent } from "./todo-domain-event.js";


 @serialize("Test")
export class TodoDescriptionUpdated extends TodoDomainEvent
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