import { given } from "@nivinjoseph/n-defensive";
import { AggregateRoot, DomainContext, DomainEvent, DomainEventData, DomainHelper } from "../../src/index.js";
import { TodoCreated } from "./events/todo-created.js";
import { TodoDescriptionUpdated } from "./events/todo-description-updated.js";
import { TodoDomainEvent } from "./events/todo-domain-event.js";
import { TodoMarkedAsCompleted } from "./events/todo-marked-as-completed.js";
import { TodoRebased } from "./events/todo-rebased.js";
import { TodoTitleUpdated } from "./events/todo-title-updated.js";
import { TodoState, TodoStateFactory } from "./todo-state.js";
import { TodoDescription } from "./value-objects/todo-description.js";
import { serialize } from "@nivinjoseph/n-util";


@serialize
export class Todo extends AggregateRoot<TodoState, TodoDomainEvent>
{
    public get title(): string { return this.state.title; }
    public get description(): string | null { return this.state.description?.description ?? null; }
    public get isCompleted(): boolean { return this.state.isCompleted; }


    public constructor(domainContext: DomainContext, events: ReadonlyArray<DomainEvent<TodoState>>, state?: TodoState)
    {
        super(domainContext, events, new TodoStateFactory(), state);
    }


    public static create(domainContext: DomainContext, title: string, description: string | null): Todo
    {
        given(domainContext, "domainContext").ensureHasValue().ensureIsObject();
        given(title, "title").ensureHasValue().ensureIsString();
        given(description as string, "description").ensureIsString();

        return new Todo(domainContext, [new TodoCreated({
            todoId: DomainHelper.generateId("tdo"),
            title,
            description: description != null ? TodoDescription.create(description) : null
        })]);
    }

    public static deserializeEvents(domainContext: DomainContext, eventData: ReadonlyArray<DomainEventData>): Todo
    {
        // const eventTypes = [
        //     TodoCreated,
        //     TodoTitleUpdated,
        //     TodoDescriptionUpdated,
        //     TodoMarkedAsCompleted
        // ];

        return AggregateRoot.deserializeFromEvents(domainContext, Todo, eventData);
    }

    public static deserializeSnapshot(domainContext: DomainContext, snapshot: object): Todo
    {
        return AggregateRoot.deserializeFromSnapshot(domainContext, Todo, new TodoStateFactory(), snapshot);
    }


    public updateTitle(title: string): void
    {
        given(title, "title").ensureHasValue().ensureIsString();

        title = title.trim();

        this.applyEvent(new TodoTitleUpdated({ title }));
    }

    public updateDescription(description: string | null): void
    {
        given(description as string, "description").ensureIsString();

        description = description && !description.isEmptyOrWhiteSpace() ? description.trim() : null;

        this.applyEvent(new TodoDescriptionUpdated({
            description: description != null ? TodoDescription.create(description) : null
        }));
    }

    public markAsCompleted(): void
    {
        this.applyEvent(new TodoMarkedAsCompleted({}));
    }

    public override rebase(version: number): void
    {
        super.rebase(version,
            (defaultState: object, rebaseState: object, rebaseVersion: number) =>
            {
                return new TodoRebased({
                    defaultState,
                    rebaseState,
                    rebaseVersion
                });
            });
    }


    // protected trim(retroEvents: ReadonlyArray<DomainEvent<TodoState>>): ReadonlyArray<DomainEvent<TodoState>>
    // {
    //     const result = [...super.trim(retroEvents)];

    //     if (this.hasCurrentEventOfType(TodoDescriptionUpdated))
    //         this.getRetroEventsOfType(TodoDescriptionUpdated).forEach(t => result.remove(t));

    //     return result;
    // }
}