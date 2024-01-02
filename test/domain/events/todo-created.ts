import { given } from "@nivinjoseph/n-defensive";
import { serialize } from "@nivinjoseph/n-util";
import { DomainEvent, DomainEventData } from "../../../src/index.js";
import { TodoState } from "../todo-state.js";
import { TodoDescription } from "../value-objects/todo-description.js";
import { TodoDomainEvent } from "./todo-domain-event.js";
import { Todo } from "../todo.js";


@serialize
export class TodoCreated extends DomainEvent<TodoState> implements TodoDomainEvent
{
    private readonly _todoId: string;
    private readonly _title: string;
    private readonly _description: TodoDescription | null;


    @serialize
    public get todoId(): string { return this._todoId; }

    @serialize
    public get title(): string { return this._title; }

    @serialize
    public get description(): TodoDescription | null { return this._description; }

    public override get refType(): string
    {
        return Todo.getTypeName();
    }


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

        given(description, "description").ensureIsType(TodoDescription);
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
    description: TodoDescription | null;
}