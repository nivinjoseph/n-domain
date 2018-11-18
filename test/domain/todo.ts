import { AggregateRoot, AggregateRootData, DomainHelper, DomainContext } from "../../src";
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



    public static create(domainContext: DomainContext, title: string, description: string | null): Todo
    {
        given(domainContext, "domainContext").ensureHasValue().ensureIsObject();
        given(title, "title").ensureHasValue().ensureIsString();
        given(description, "description").ensureIsString();

        return new Todo(domainContext, [new TodoCreatedEvent({}, DomainHelper.generateId(), title, description)]);
    }

    public static deserialize(domainContext: DomainContext, data: object): Todo
    {
        given(domainContext, "domainContext").ensureHasValue().ensureIsObject();
        given(data, "data").ensureHasValue().ensureIsObject();

        const eventTypes = [
            TodoCreatedEvent,
            TodoTitleUpdatedEvent,
            TodoDescriptionUpdatedEvent,
            TodoMarkedAsCompletedEvent
        ];

        return AggregateRoot.deserialize(domainContext, Todo, eventTypes, data as AggregateRootData) as Todo;
    }


    public updateTitle(title: string): void
    {
        given(title, "title").ensureHasValue().ensureIsString();

        title = title.trim();

        this.applyEvent(new TodoTitleUpdatedEvent({}, title));
    }

    public updateDescription(description: string | null): void
    {
        given(description, "description").ensureIsString();

        description = description && !description.isEmptyOrWhiteSpace() ? description.trim() : null;

        this.applyEvent(new TodoDescriptionUpdatedEvent({}, description));
    }

    public markAsCompleted(): void
    {
        this.applyEvent(new TodoMarkedAsCompletedEvent({}));
    }
}