import { TodoState } from "../todo-state";
import { deserialize } from "@nivinjoseph/n-util";
import { TodoDomainEvent } from "./todo-domain-event";


@deserialize
export class TodoMarkedAsCompleted extends TodoDomainEvent
{
    // public static deserializeEvent(data: DomainEventData): TodoMarkedAsCompleted
    // {
    //     given(data, "data").ensureHasValue().ensureIsObject();

    //     return new TodoMarkedAsCompleted(data);
    // }


    // protected serializeEvent(): object
    // {
    //     return {};
    // }

    protected applyEvent(state: TodoState): void
    {
        state.isCompleted = true;
    }
}