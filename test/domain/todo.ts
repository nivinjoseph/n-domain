import { AggregateRoot, AggregateRootData, DomainHelper, DomainContext } from "../../src";
import { TodoState } from "./todo-state";
import { TodoCreated } from "./events/todo-created";
import { TodoTitleUpdated } from "./events/todo-title-updated";
import { TodoDescriptionUpdated } from "./events/todo-description-updated";
import { TodoMarkedAsCompleted } from "./events/todo-marked-as-completed";
import { given } from "@nivinjoseph/n-defensive";


export class Todo extends AggregateRoot<TodoState>
{
    public get title(): string { return this.state.title; }
    public get description(): string | null { return this.state.description; }
    public get isCompleted(): boolean { return this.state.isCompleted; }


    public static create(domainContext: DomainContext, title: string, description: string | null): Todo
    {
        given(domainContext, "domainContext").ensureHasValue().ensureIsObject();
        given(title, "title").ensureHasValue().ensureIsString();
        given(description, "description").ensureIsString();

        return new Todo(domainContext, [new TodoCreated({$isCreatedEvent: true}, DomainHelper.generateId(), title, description)]);
    }

    public static deserialize(domainContext: DomainContext, data: object): Todo
    {
        given(domainContext, "domainContext").ensureHasValue().ensureIsObject();
        given(data, "data").ensureHasValue().ensureIsObject();

        const eventTypes = [
            TodoCreated,
            TodoTitleUpdated,
            TodoDescriptionUpdated,
            TodoMarkedAsCompleted
        ];

        return AggregateRoot.deserialize(domainContext, Todo, eventTypes, data as AggregateRootData) as Todo;
    }


    public updateTitle(title: string): void
    {
        given(title, "title").ensureHasValue().ensureIsString();

        title = title.trim();

        this.applyEvent(new TodoTitleUpdated({}, title));
    }

    public updateDescription(description: string | null): void
    {
        given(description, "description").ensureIsString();

        description = description && !description.isEmptyOrWhiteSpace() ? description.trim() : null;

        this.applyEvent(new TodoDescriptionUpdated({}, description));
    }

    public markAsCompleted(): void
    {
        this.applyEvent(new TodoMarkedAsCompleted({}));
    }
}