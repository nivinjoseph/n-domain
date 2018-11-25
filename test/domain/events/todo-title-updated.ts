import { given } from "@nivinjoseph/n-defensive";
import { TodoState } from "../todo-state";
import { DomainEvent, DomainEventData } from "../../../src";


export class TodoTitleUpdated extends DomainEvent<TodoState>
{
    private readonly _title: string;


    public constructor(data: DomainEventData, title: string)
    {
        super(data);

        given(title, "title").ensureHasValue().ensureIsString();
        this._title = title;
    }

    
    public static deserializeEvent(data: DomainEventData & Serialized): TodoTitleUpdated
    {
        given(data, "data").ensureHasValue().ensureIsObject();

        return new TodoTitleUpdated(data, data.title);
    }

    
    protected serializeEvent(): Serialized
    {
        return {
            title: this._title
        };
    }

    protected applyEvent(state: TodoState): void
    {
        state.title = this._title;
    }
}


interface Serialized
{
    title: string;
}