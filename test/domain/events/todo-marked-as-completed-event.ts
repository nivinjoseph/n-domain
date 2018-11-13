import { TodoState } from "../todo-state";
import { given } from "@nivinjoseph/n-defensive";
import { DomainEvent, DomainEventData } from "../../../src";


export class TodoMarkedAsCompletedEvent extends DomainEvent<TodoState>
{
    public static deserializeEvent(data: DomainEventData): TodoMarkedAsCompletedEvent
    {
        given(data, "data").ensureHasValue().ensureIsObject();

        return new TodoMarkedAsCompletedEvent(data);
    }


    protected serializeEvent(): object
    {
        return {};
    }

    protected applyEvent(state: TodoState): void
    {
        state.isCompleted = true;
    }
}