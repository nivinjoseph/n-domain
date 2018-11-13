import { TodoState } from "../todo-state";
import { given } from "@nivinjoseph/n-defensive";
import { DomainEvent, DomainEventData } from "../../../src";



export class TodoCreatedEvent extends DomainEvent<TodoState>
{
    private readonly _id: string;
    private readonly _title: string;
    private readonly _description: string | null;


    public constructor(data: DomainEventData, id: string, title: string, description: string | null)
    {
        super(data);

        given(id, "id").ensureHasValue().ensureIsString();
        this._id = id;

        given(title, "title").ensureHasValue().ensureIsString();
        this._title = title;

        given(description, "description").ensureIsString();
        this._description = description;
    }


    public static deserializeEvent(data: DomainEventData & Serialized): TodoCreatedEvent
    {
        given(data, "data").ensureHasValue().ensureIsObject();

        return new TodoCreatedEvent(data, data.id, data.title, data.description);
    }


    protected serializeEvent(): Serialized
    {
        return {
            id: this._id,
            title: this._title,
            description: this._description
        };
    }

    protected applyEvent(state: TodoState): void
    {
        given(state, "state").ensureHasValue().ensureIsObject();

        state.id = this._id;
        state.title = this._title;
        state.description = this._description;
    }
}


interface Serialized
{
    id: string;
    title: string;
    description: string | null;
}