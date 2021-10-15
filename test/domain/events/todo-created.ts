import { TodoState } from "../todo-state";
import { given } from "@nivinjoseph/n-defensive";
import { DomainEvent, DomainEventData } from "../../../src";
import { serialize } from "@nivinjoseph/n-util";


export class TodoCreated extends DomainEvent<TodoState>
{
    private readonly _todoId: string;
    private readonly _title: string;
    private readonly _description: string | null;
    
    
    @serialize
    public get todoId(): string { return this._todoId; }
    
    @serialize
    public get title(): string { return this._title; }
    
    @serialize
    public get description(): string | null { return this._description; }

    
    public constructor(data: EventData)
    {
        given(data, "data").ensureHasValue().ensureIsObject();
        data.$isCreatedEvent = true;
        super(data);

        const { todoId, title, description } = data;
        
        given(todoId, "todoId").ensureHasValue().ensureIsString();
        this._todoId = todoId;

        given(title, "title").ensureHasValue().ensureIsString();
        this._title = title;

        given(description as string, "description").ensureIsString();
        this._description = description;
    }


    // public static deserializeEvent(data: DomainEventData & Serialized): TodoCreated
    // {
    //     given(data, "data").ensureHasValue().ensureIsObject();

    //     return new TodoCreated(data, data.todoId, data.title, data.description);
    // }


    // protected serializeEvent(): Serialized
    // {
    //     return {
    //         todoId: this._todoId,
    //         title: this._title,
    //         description: this._description
    //     };
    // }

    protected applyEvent(state: TodoState): void
    {
        given(state, "state").ensureHasValue().ensureIsObject();

        state.id = this._todoId;
        state.title = this._title;
        state.description = this._description;
    }
}


interface EventData extends DomainEventData
{
    todoId: string;
    title: string;
    description: string | null;
}