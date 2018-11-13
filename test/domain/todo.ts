import { AggregateRoot, AggregateRootData, DomainHelper } from "../../src";
import { TodoState } from "./todo-state";
import { TodoCreatedEvent } from "./events/todo-created-event";
import { TodoTitleUpdatedEvent } from "./events/todo-title-updated-event";
import { TodoDescriptionUpdatedEvent } from "./events/todo-description-updated-event";
import { TodoMarkedAsCompletedEvent } from "./events/todo-marked-as-completed-event";
import { given } from "@nivinjoseph/n-defensive";


export class Todo extends AggregateRoot<TodoState>
{
    // @ts-ignore: strictNullChecks
    public get createdAt(): number { return this.events.find(t => t.name === (<Object>TodoCreatedEvent).getTypeName()).occurredAt; }
    public get title(): string { return this.state.title; }
    public get description(): string | null { return this.state.description; }
    public get isCompleted(): boolean { return this.state.isCompleted; }



    public static create(title: string, description: string | null): Todo
    {
        given(title, "title").ensureHasValue().ensureIsString();
        given(description, "description").ensureIsString();

        return new Todo([new TodoCreatedEvent({ $user: "dev" }, DomainHelper.generateId(), title, description)]);
    }

    public static deserialize(data: object): Todo
    {
        const eventTypes = [
            TodoCreatedEvent,
            TodoTitleUpdatedEvent,
            TodoDescriptionUpdatedEvent,
            TodoMarkedAsCompletedEvent
        ];

        return AggregateRoot.deserialize(Todo, eventTypes, data as AggregateRootData) as Todo;
    }


    public updateTitle(title: string): void
    {
        given(title, "title").ensureHasValue().ensureIsString();

        title = title.trim();

        this.applyEvent(new TodoTitleUpdatedEvent({ $user: "dev" }, title));
    }

    public updateDescription(description: string | null): void
    {
        given(description, "description").ensureIsString();

        description = description && !description.isEmptyOrWhiteSpace() ? description.trim() : null;

        this.applyEvent(new TodoDescriptionUpdatedEvent({$user: "dev"}, description));
    }

    public markAsCompleted(): void
    {
        this.applyEvent(new TodoMarkedAsCompletedEvent({$user: "dev"}));
    }
}