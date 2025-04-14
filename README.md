# n-domain

## Overview

n-domain is a TypeScript framework that provides a robust foundation for implementing business logic using Domain-Driven Design (DDD) and Event Sourcing patterns. It helps you create maintainable and scalable domain models while enforcing best practices in domain-driven design.

## Features

- **Domain-Driven Design Support**: Built-in abstractions for DDD concepts like Aggregates, Entities, and Domain Events
- **Event Sourcing**: Native support for event-sourced aggregates and state management
- **Type Safety**: Written in TypeScript with strong typing support
- **Flexible Configuration**: Configurable domain contexts and state management
- **Clean Architecture**: Promotes separation of concerns and clean architecture principles

## Installation

```bash
# Using npm
npm install @nivinjoseph/n-domain

# Using yarn
yarn add @nivinjoseph/n-domain
```

## Domain Organization

The framework encourages a clean and organized domain structure. Here's how to organize your domain:

```
domain/
├── aggregate.ts           # Main aggregate root implementation
├── aggregate-state.ts     # State interface and factory
├── events/                # Domain events
│   ├── aggregate-created.ts
│   ├── aggregate-updated.ts
│   └── aggregate-deleted.ts
└── value-objects/        # Value objects
    ├── description.ts
    └── other-value-objects.ts
```

### Key Components

1. **Aggregate Root** (`aggregate.ts`)
   - Main business entity
   - Handles business logic
   - Manages state changes through events
   - Example: `Todo` aggregate

2. **State Management** (`aggregate-state.ts`)
   - Defines the state interface
   - Implements state factory
   - Handles state transitions
   - Example: `TodoState` and `TodoStateFactory`

3. **Domain Events** (`events/`)
   - Represent state changes
   - Immutable and serializable
   - Follow naming convention: `AggregateActionEvent`
   - Examples: `TodoCreated`, `TodoUpdated`, `TodoDeleted`

4. **Value Objects** (`value-objects/`)
   - Immutable objects
   - No identity
   - Represent domain concepts
   - Examples: `TodoDescription`, `Address`, `Money`

## Core Concepts

### Aggregate Roots

Aggregate roots are the main building blocks of your domain model. They encapsulate business logic and ensure consistency boundaries. Example:

```typescript
import { given } from "@nivinjoseph/n-defensive";
import { AggregateRoot, DomainContext, DomainEvent } from "@nivinjoseph/n-domain";
import { TodoCreated } from "./events/todo-created";
import { TodoState, TodoStateFactory } from "./todo-state";

@serialize("Test")
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

    public updateTitle(title: string): void
    {
        given(title, "title").ensureHasValue().ensureIsString();
        title = title.trim();
        this.applyEvent(new TodoTitleUpdated({ title }));
    }
}
```

### Domain Events

Domain events represent state changes in your aggregates. They are immutable and carry the data necessary to modify the aggregate state:

```typescript
import { given } from "@nivinjoseph/n-defensive";
import { serialize } from "@nivinjoseph/n-util";
import { DomainEventData } from "@nivinjoseph/n-domain";
import { TodoState } from "../todo-state";


@serialize("Test")
export class TodoCreated extends TodoDomainEvent
{
    private readonly _todoId: string;
    private readonly _title: string;

    @serialize
    public get todoId(): string { return this._todoId; }

    @serialize
    public get title(): string { return this._title; }

    @serialize
    public get description(): TodoDescription | null { return this._description; }

    public constructor(data: EventData)
    {
        given(data, "data").ensureHasValue().ensureIsObject();
        data.$isCreatedEvent = true;
        super(data);

        const { todoId, title } = data;

        given(todoId, "todoId").ensureHasValue().ensureIsString();
        this._todoId = todoId;

        given(title, "title").ensureHasValue().ensureIsString();
        this._title = title;
    }

    protected applyEvent(state: TodoState): void
    {
        given(state, "state").ensureHasValue().ensureIsObject();
        state.id = this._todoId;
        state.title = this._title;
    }
}

interface EventData extends DomainEventData
{
    todoId: string;
    title: string;
}
```

### State Management

State management is handled through state interfaces and factories:

```typescript
import { AggregateState } from "@nivinjoseph/n-domain";
import { AggregateStateFactory } from "@nivinjoseph/n-domain";
import { TodoDescription } from "./value-objects/todo-description";

export interface TodoState extends AggregateState
{
    title: string;
    description: TodoDescription | null;
    isCompleted: boolean;
}

export class TodoStateFactory extends AggregateStateFactory<TodoState>
{
    public create(): TodoState
    {
        return {
            ...this.createDefaultAggregateState(),
            title: null as any,
            description: null,
            isCompleted: false
        };
    }
}
```

## API Reference

### AggregateRoot

Base class for aggregate roots in your domain model.

Properties:
- `context`: DomainContext - The domain context
- `id`: string - Unique identifier for the aggregate
- `retroEvents`: ReadonlyArray<DomainEvent<T>> - Historical events
- `retroVersion`: number - Version of historical events
- `currentEvents`: ReadonlyArray<DomainEvent<T>> - Current uncommitted events
- `currentVersion`: number - Current version of the aggregate
- `events`: ReadonlyArray<DomainEvent<T>> - All events (historical + current)
- `version`: number - Current version of the aggregate
- `createdAt`: number - Creation timestamp
- `updatedAt`: number - Last update timestamp
- `isNew`: boolean - Whether the aggregate is newly created
- `hasChanges`: boolean - Whether there are uncommitted changes
- `isReconstructed`: boolean - Whether the aggregate was reconstructed
- `reconstructedFromVersion`: number - Version from which the aggregate was reconstructed
- `isRebased`: boolean - Whether the aggregate was rebased
- `rebasedFromVersion`: number - Version from which the aggregate was rebased

Key Methods:
- `deserializeFromEvents(domainContext: DomainContext, aggregateType: new (...args: Array<any>) => TAggregate, eventData: ReadonlyArray<DomainEventData>)`: Static method to reconstruct an aggregate from events
- `deserializeFromSnapshot(domainContext: DomainContext, aggregateType: new (...args: Array<any>) => TAggregate, stateFactory: AggregateStateFactory<TAggregateState>, stateSnapshot: TAggregateState | object)`: Static method to reconstruct an aggregate from a snapshot
- `snapshot(...cloneKeys: ReadonlyArray<string>)`: Create a snapshot of the current state
- `constructVersion(version: number)`: Construct the aggregate at a specific version
- `constructBefore(dateTime: number)`: Construct the aggregate before a specific timestamp
- `hasEventOfType(eventType: new (...args: Array<any>) => TEventType)`: Check if any event of a specific type exists
- `hasRetroEventOfType(eventType: new (...args: Array<any>) => TEventType)`: Check if any historical event of a specific type exists
- `hasCurrentEventOfType(eventType: new (...args: Array<any>) => TEventType)`: Check if any current event of a specific type exists
- `getEventsOfType(eventType: new (...args: Array<any>) => TEventType)`: Get all events of a specific type
- `getRetroEventsOfType(eventType: new (...args: Array<any>) => TEventType)`: Get all historical events of a specific type
- `getCurrentEventsOfType(eventType: new (...args: Array<any>) => TEventType)`: Get all current events of a specific type
- `clone(domainContext: DomainContext, createdEvent: DomainEvent<T>, serializedEventMutatorAndFilter?: (event: { $name: string; }) => boolean)`: Create a clone of the aggregate
- `rebase(version: number, rebasedEventFactoryFunc: (defaultState: object, rebaseState: object, rebaseVersion: number) => TDomainEvent)`: Rebase the aggregate to a specific version
- `applyEvent(event: TDomainEvent)`: Apply a new event to the aggregate

### DomainEvent

Base class for domain events.

Properties:
- `aggregateId`: string - ID of the aggregate this event belongs to
- `id`: string - Unique identifier for the event
- `userId`: string - ID of the user who triggered the event
- `name`: string - Name of the event type
- `partitionKey`: string - Same as aggregateId (for n-eda compatibility)
- `refId`: string - Same as aggregateId (for n-eda compatibility)
- `refType`: string - Abstract property to be implemented (for n-eda compatibility)
- `occurredAt`: number - Timestamp when the event occurred
- `version`: number - Version number of the event
- `isCreatedEvent`: boolean - Whether this is a creation event

Key Methods:
- `apply(aggregate: AggregateRoot<T, DomainEvent<T>>, domainContext: DomainContext, state: T)`: Apply the event to an aggregate
- `applyEvent(state: T)`: Abstract method to be implemented for applying event-specific changes to state

### AggregateState

Base interface for aggregate state.

Properties:
- `id`: string - Unique identifier for the aggregate
- `version`: number - Current version of the aggregate
- `createdAt`: number - Creation timestamp
- `updatedAt`: number - Last update timestamp
- `isDeleted`: boolean - Whether the aggregate is deleted
- `isRebased`: boolean - Whether the aggregate was rebased
- `rebasedFromVersion`: number - Version from which the aggregate was rebased

### DomainContext

Interface for domain context.

Properties:
- `userId`: string - ID of the current user

### ConfigurableDomainContext

Class for configuring domain context.

Properties:
- `userId`: string - ID of the current user

Methods:
- `configure(userId: string)`: Configure the domain context with a user ID

## Best Practices

1. **Event Design**
   - Keep events immutable
   - Include only necessary data
   - Use meaningful event names
   - Use `@serialize` decorator for serialization
   - Implement proper validation using `given`

2. **Aggregate Design**
   - Keep aggregates focused and cohesive
   - Maintain consistency boundaries
   - Use event sourcing for complex state management
   - Implement proper validation in all public methods
   - Use static factory methods for creation

3. **State Management**
   - Use the built-in state management helpers
   - Implement proper event handlers
   - Consider performance implications of event history
   - Use proper typing for state interfaces

4. **Domain Organization**
   - Keep related files close together
   - Use clear naming conventions
   - Separate concerns into appropriate directories
   - Maintain a flat structure for better discoverability

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues and feature requests, please use the GitHub issue tracker.
