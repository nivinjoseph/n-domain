import { serialize } from "@nivinjoseph/n-util";
import { TodoState } from "../todo-state.js";
import { TodoDomainEvent } from "./todo-domain-event.js";


@serialize
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