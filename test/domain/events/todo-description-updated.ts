import { TodoState } from "../todo-state";
import { given } from "@nivinjoseph/n-defensive";
import { DomainEvent, DomainEventData } from "../../../src";
import { serialize } from "@nivinjoseph/n-util";


export class TodoDescriptionUpdated extends DomainEvent<TodoState>
{
    private readonly _description: string | null;
    
    @serialize
    public get description(): string | null { return this._description; }


    public constructor(data: EventData)
    {
        super(data);

        const { description } = data;
        
        given(description as string, "description").ensureIsString();
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
    description: string | null;
}