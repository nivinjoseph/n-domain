import { AggregateRoot, DomainHelper, DomainContext, DomainEvent, DomainEventData} from "../../src";
import { TodoState, TodoStateFactory } from "./todo-state";
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

    
    public constructor(domainContext: DomainContext, events: ReadonlyArray<DomainEvent<TodoState>>, state?: TodoState)
    {
        super(domainContext, events, new TodoStateFactory(), state);
    }
    
    
    public static create(domainContext: DomainContext, title: string, description: string | null): Todo
    {
        given(domainContext, "domainContext").ensureHasValue().ensureIsObject();
        given(title, "title").ensureHasValue().ensureIsString();
        given(description as string, "description").ensureIsString();

        return new Todo(domainContext, [new TodoCreated({$isCreatedEvent: true}, DomainHelper.generateId(), title, description)]);
    }

    public static deserializeEvents(domainContext: DomainContext, eventData: ReadonlyArray<DomainEventData>): Todo
    {
        const eventTypes = [
            TodoCreated,
            TodoTitleUpdated,
            TodoDescriptionUpdated,
            TodoMarkedAsCompleted
        ];

        return AggregateRoot.deserializeFromEvents(domainContext, Todo, eventTypes, eventData);
    }
    
    public static deserializeSnapshot(domainContext: DomainContext, snapshot: object): Todo
    {
        return AggregateRoot.deserializeFromSnapshot(domainContext, Todo, new TodoStateFactory(), snapshot);
    }


    public updateTitle(title: string): void
    {
        given(title, "title").ensureHasValue().ensureIsString();

        title = title.trim();
        
        this.applyEvent(new TodoTitleUpdated({}, title));
    }

    public updateDescription(description: string | null): void
    {
        given(description as string, "description").ensureIsString();

        description = description && !description.isEmptyOrWhiteSpace() ? description.trim() : null;

        this.applyEvent(new TodoDescriptionUpdated({}, description));
    }

    public markAsCompleted(): void
    {
        this.applyEvent(new TodoMarkedAsCompleted({}));
    }
    
    
    // protected trim(retroEvents: ReadonlyArray<DomainEvent<TodoState>>): ReadonlyArray<DomainEvent<TodoState>>
    // {
    //     const result = [...super.trim(retroEvents)];
        
    //     if (this.hasCurrentEventOfType(TodoDescriptionUpdated))
    //         this.getRetroEventsOfType(TodoDescriptionUpdated).forEach(t => result.remove(t));
        
    //     return result;
    // }
}