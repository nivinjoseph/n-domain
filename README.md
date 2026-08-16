# n-domain

## Overview

n-domain is a TypeScript framework that provides a robust foundation for implementing business logic using Domain-Driven Design (DDD) and Event Sourcing patterns. It helps you create maintainable and scalable domain models while enforcing best practices in domain-driven design.

## Features

- **Domain-Driven Design Support**: Built-in abstractions for DDD concepts like Aggregates, Entities, Value Objects, and Domain Events
- **Event Sourcing**: Native support for event-sourced aggregates, snapshots, rebasing, and point-in-time reconstruction
- **Replay Safety**: Created events freeze the aggregate's initial defaults so replays are isolated from future code changes; a fingerprint helper supports drift-guard tests
- **State Versioning**: `typeVersion`-based state migration with a built-in guard against loading unmigrated state
- **Multi-Tenancy**: `Org*` variants of the core types that scope aggregates to an organization
- **Type Safety**: Written in TypeScript with strong typing support

## Installation

```bash
# Using npm
npm install @nivinjoseph/n-domain

# Using yarn
yarn add @nivinjoseph/n-domain
```

### Requirements & setup

- **Node.js >= 24.10** (see `engines` in package.json).
- **ESM only** — the package is published with `"type": "module"`; there is no CommonJS build.
- **Standard (ES2023+) decorators** — serialization is driven by the `@serialize` decorator from `@nivinjoseph/n-util`, which registers getters under `Symbol.metadata` (polyfilled by n-util at load). Compile with TypeScript 5+ standard decorators; do **not** enable `experimentalDecorators`.
- **Side effect on import** — importing this package also loads `@nivinjoseph/n-ext`, which installs string/array prototype extensions (`orderBy`, `take`, `isEmptyOrWhiteSpace`, ...) that the library and its examples use freely.

### Ecosystem

n-domain builds on a small family of sibling packages you will encounter while using it:

- `@nivinjoseph/n-util` — `Serializable`, the `@serialize` decorator, and `Deserializer`; the entire serialization/replay mechanism lives here.
- `@nivinjoseph/n-defensive` — the `given(...)` fluent assertions; every runtime contract in this library is expressed with it, and it is the recommended validation style for your domain code.
- `@nivinjoseph/n-ext` — prototype extensions, loaded as a side effect (see above).
- `@nivinjoseph/n-eda` — **not** a dependency, but `DomainEvent`'s `refType`, `refId`, and `partitionKey` exist for compatibility with it; you must implement `refType` even if you don't use n-eda.

## Domain Organization

The framework encourages a clean and organized domain structure. Here's how to organize your domain:

```
domain/
├── todo.ts                # Aggregate root implementation
├── todo-state.ts          # State interface and state factory
├── events/                # Domain events
│   ├── todo-domain-event.ts   # Abstract event base for this aggregate
│   ├── todo-created.ts
│   ├── todo-title-updated.ts
│   └── todo-rebased.ts
└── value-objects/         # Value objects
    └── todo-description.ts
```

### Key Components

1. **Aggregate Root** (`todo.ts`)
   - Main business entity; handles business logic
   - Manages state changes exclusively through events

2. **State** (`todo-state.ts`)
   - Defines the state interface (extends `AggregateState`)
   - Implements the state factory (`AggregateStateFactory`) which owns defaults, migrations, and snapshot deserialization

3. **Domain Events** (`events/`)
   - Represent state changes; immutable and serializable
   - Each aggregate defines an abstract event base class that implements `refType`

4. **Value Objects** (`value-objects/`)
   - Immutable, no identity; extend `DomainObject`

## Core Concepts

### Aggregate Roots

Aggregate roots are the main building blocks of your domain model. They encapsulate business logic and ensure consistency boundaries. Use `AggregateFactory` to instantiate aggregates:

```typescript
import { given } from "@nivinjoseph/n-defensive";
import { serialize } from "@nivinjoseph/n-util";
import { AggregateFactory, AggregateRoot, DomainContext, DomainHelper } from "@nivinjoseph/n-domain";
import { TodoCreated } from "./events/todo-created.js";
import { TodoDomainEvent } from "./events/todo-domain-event.js";
import { TodoRebased } from "./events/todo-rebased.js";
import { TodoTitleUpdated } from "./events/todo-title-updated.js";
import { TodoState, TodoStateFactory } from "./todo-state.js";
import { TodoDescription } from "./value-objects/todo-description.js";


@serialize("App") // your app's serialization namespace
export class Todo extends AggregateRoot<TodoState, TodoDomainEvent>
{
    public get title(): string { return this.state.title; }
    public get description(): string | null { return this.state.description?.description ?? null; }
    public get isCompleted(): boolean { return this.state.isCompleted; }


    public static create(domainContext: DomainContext, title: string, description: string | null): Todo
    {
        given(domainContext, "domainContext").ensureHasValue().ensureIsObject();
        given(title, "title").ensureHasValue().ensureIsString();
        given(description as string, "description").ensureIsString();

        const createdEvent = new TodoCreated({
            todoId: DomainHelper.generateId("tdo"),
            title,
            description: description != null ? TodoDescription.create(description) : null
        });

        return new AggregateFactory(Todo, domainContext, new TodoStateFactory())
            .createFromEvents([createdEvent]);
    }

    public updateTitle(title: string): void
    {
        given(title, "title").ensureHasValue().ensureIsString();
        title = title.trim();
        this.applyEvent(new TodoTitleUpdated({ title }));
    }

    // rebase() is protected on AggregateRoot; expose it by overriding with your rebased event
    public override rebase(version: number): void
    {
        super.rebase(version, (defaultState, rebaseState, rebaseVersion) =>
            new TodoRebased({ defaultState, rebaseState, rebaseVersion }));
    }
}
```

### Domain Events

Every aggregate defines an abstract event base class that implements `refType` (used for n-eda compatibility). Concrete events extend it:

```typescript
import { DomainEvent } from "@nivinjoseph/n-domain";
import { TodoState } from "../todo-state.js";


export abstract class TodoDomainEvent extends DomainEvent<TodoState>
{
    // Return the aggregate's type name as a string literal.
    // Do NOT import the aggregate class here — that creates a circular dependency that blows up at runtime.
    public get refType(): string { return "Todo"; }
}
```

Concrete events carry the data necessary to modify the aggregate state and implement `applyEvent`:

```typescript
import { given } from "@nivinjoseph/n-defensive";
import { serialize } from "@nivinjoseph/n-util";
import { DomainEventData } from "@nivinjoseph/n-domain";
import { TodoState } from "../todo-state.js";
import { TodoDescription } from "../value-objects/todo-description.js";
import { TodoDomainEvent } from "./todo-domain-event.js";


@serialize("App")
export class TodoCreated extends TodoDomainEvent
{
    private readonly _todoId: string;
    private readonly _title: string;
    private readonly _description: TodoDescription | null;

    @serialize
    public get todoId(): string { return this._todoId; }

    @serialize
    public get title(): string { return this._title; }

    @serialize
    public get description(): TodoDescription | null { return this._description; }

    public constructor(data: EventData)
    {
        given(data, "data").ensureHasValue().ensureIsObject();
        data.$isCreatedEvent = true; // only on the creation event
        super(data);

        const { todoId, title, description } = data;

        given(todoId, "todoId").ensureHasValue().ensureIsString();
        this._todoId = todoId;

        given(title, "title").ensureHasValue().ensureIsString();
        this._title = title;

        given(description, "description").ensureIsType(TodoDescription);
        this._description = description;
    }

    protected applyEvent(state: TodoState): void
    {
        given(state, "state").ensureHasValue().ensureIsObject();
        state.id = this._todoId; // the created event MUST set the aggregate id
        state.title = this._title;
        state.description = this._description;
    }
}

interface EventData extends DomainEventData
{
    todoId: string;
    title: string;
    description: TodoDescription | null;
}
```

### State Management

State is defined by an interface extending `AggregateState` and produced by a factory extending `AggregateStateFactory`:

```typescript
import { AggregateState, AggregateStateFactory } from "@nivinjoseph/n-domain";
import { TodoDescription } from "./value-objects/todo-description.js";

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

#### State migrations (`typeVersion`)

`createDefaultAggregateState()` initializes `typeVersion` to `1`. When you make a breaking change to the state shape:

1. Bump `typeVersion` in your factory's `create()`.
2. Override `update(state)` to migrate older state forward (and set its `typeVersion` accordingly).

The `AggregateRoot` constructor runs every loaded state through `update()` and **throws** if the resulting `typeVersion` doesn't match the current `create()` output — so an unmigrated snapshot or stream fails fast instead of loading silently corrupted state.

```typescript
export class TodoStateFactory extends AggregateStateFactory<TodoState>
{
    public create(): TodoState
    {
        return {
            ...this.createDefaultAggregateState(),
            typeVersion: 2, // bumped due to shape change
            title: null as any,
            description: null,
            isCompleted: false
        } as TodoState;
    }

    public override update(state: TodoState): TodoState
    {
        if (state.typeVersion === 1)
        {
            // migrate v1 -> v2 here
            (state as { typeVersion: number; }).typeVersion = 2;
        }
        return state;
    }
}
```

### Replay safety: frozen created-event defaults

When a new aggregate is created, the pristine output of the state factory's `create()` (with base fields stripped) is frozen into the created event and serialized as `$frozenDefaultState`. On every future replay, this frozen snapshot is overlaid as the base layer before events apply.

This means fields that no event ever writes are sourced from the **stream** rather than from a possibly-changed future `create()` — changing a default in `create()` no longer silently rewrites historical aggregates on replay. Brand-new fields added to `create()` later still fall through to the current default (additive evolution is preserved). Only created events carry this payload; other events' serialized shape is unchanged.

#### Drift guard

Because changing an *existing* default in `create()` is a meaningful (and easy-to-miss) act, `AggregateStateHelper.fingerprintState()` produces a stable, canonically-sorted SHA-512 fingerprint of a state object. The intended pattern is a drift-guard test: persist the fingerprint of `create()` in source control and fail the test when it changes unexpectedly.

```typescript
import { AggregateStateHelper } from "@nivinjoseph/n-domain";

const EXPECTED_FINGERPRINT = "..."; // checked into source control

test("TodoStateFactory.create() output has not drifted", () =>
{
    const fingerprint = AggregateStateHelper.fingerprintState(new TodoStateFactory().create());
    assert.strictEqual(fingerprint, EXPECTED_FINGERPRINT);
});
```

### Domain Objects and Entities

- **`DomainObject`** — base class for value objects. `equals()` is **structural**: two instances are equal if they have the same type and identical serialized state.
- **`DomainEntity`** — base class for entities (has an `id`). `equals()` is **identity-based**: two instances are equal if they have the same type and the same `id`, regardless of state. `deepEquals()` compares full serialized state (like `DomainObject.equals`).

Both are generic over `<TThis, TDataKeys>`: pass the class itself as `TThis` and the union of its `@serialize`d getter names as `TDataKeys`. Type the constructor's parameter as `DomainObjectData<TThis>` — the constructor-input shape derived from those getters, in which nested domain objects are **live instances**. (`DomainEntity` adds `"id"` to the data keys automatically.)

`serialize()` returns a different type — `DomainObjectSerialized<TThis, TDataKeys>` — the plain deep data shape: nested domain objects appear as their own serialized shapes (recursively, with `$typename` at every level), `Date`s as ISO strings. So instance methods don't exist on serialized output at the type level, and serialized output isn't assignable where a live instance is expected — both directions are compile errors.

```typescript
import { given } from "@nivinjoseph/n-defensive";
import { serialize } from "@nivinjoseph/n-util";
import { DomainObject, DomainObjectData } from "@nivinjoseph/n-domain";


@serialize("App")
export class TodoDescription extends DomainObject<TodoDescription, "description">
{
    private readonly _description: string;

    @serialize
    public get description(): string { return this._description; }

    public constructor(data: DomainObjectData<TodoDescription>)
    {
        super(data);
        const { description } = data;
        given(description, "description").ensureHasValue().ensureIsString();
        this._description = description;
    }
}
```

The `DomainObject` constructor enforces at runtime that every property in `data` corresponds to an `@serialize`d getter — fresh constructions throw otherwise. (Hydrating stored data that carries `$typename` tolerates unknown keys, since deprecated fields may linger in storage.)

### Multi-tenancy (`Org*` types)

For organization-scoped domains, use the `Org*` variants. They mirror the core types and additionally thread an `organizationId` through the context, state, events, and aggregate:

- `OrgDomainContext` — `DomainContext` plus `organizationId: string`
- `OrgConfigurableDomainContext` — `ConfigurableDomainContext` plus a settable `organizationId`; constructed with `(userId, organizationId)`
- `OrgAggregateState` — `AggregateState` plus `organizationId: string`
- `OrgAggregateStateFactory` — constructed with an `OrgDomainContext`; `createDefaultAggregateState()` stamps `organizationId` into the state
- `OrgDomainEvent` / `OrgDomainEventData` — events carry `$organizationId`; on apply, the event's `organizationId` is validated against the state's and an exception is thrown on mismatch
- `OrgAggregateRoot` — exposes `organizationId` and requires an `OrgDomainContext`; `applyEvent` only accepts `OrgDomainEvent`s

## Examples

The [`test/domain/`](test/domain/) directory is the canonical reference implementation — a complete `Todo` aggregate kept in sync with the current API:

- [`test/domain/todo.ts`](test/domain/todo.ts) — aggregate root with a static `create`, behavior methods, and a `rebase` override
- [`test/domain/todo-state.ts`](test/domain/todo-state.ts) — state interface and factory, including working `typeVersion` migration factories
- [`test/domain/events/`](test/domain/events/) — the abstract event base (`refType`), created event, update events, and a rebased event
- [`test/domain/value-objects/todo-description.ts`](test/domain/value-objects/todo-description.ts) — a value object using the current `DomainObject` generics

[`test/domain.test.ts`](test/domain.test.ts) is an executable specification: Given/When/Then suites covering creation, mutation, serialization/replay, `typeVersion` migration, point-in-time reconstruction, cloning, and rebasing. When docs and code disagree, trust these files.

## API Reference

### AggregateRoot

Abstract base class for aggregate roots. Generic over `<T extends AggregateState, TDomainEvent extends DomainEvent<T>>`.

Constructor: `(domainContext: DomainContext, events: ReadonlyArray<DomainEvent<T>>, stateFactory: AggregateStateFactory<T>, currentState?: T)` — pass events **or** a snapshot state, never both. Prefer instantiating through `AggregateFactory`.

Properties:
- `context`: DomainContext — the domain context
- `id`: string — unique identifier for the aggregate
- `retroEvents`: ReadonlyArray<DomainEvent<T>> — historical (persisted) events, ordered by version
- `retroVersion`: number — version as of the historical events
- `currentEvents`: ReadonlyArray<DomainEvent<T>> — uncommitted events applied this session
- `currentVersion`: number — current version (same as `version`)
- `events`: ReadonlyArray<DomainEvent<T>> — all events (historical + current), ordered by version
- `version`: number — current version of the aggregate
- `createdAt`: number — creation timestamp (epoch ms)
- `updatedAt`: number — last update timestamp (epoch ms)
- `isNew`: boolean — true only for a freshly created aggregate (never for reconstructed ones)
- `hasChanges`: boolean — whether there are uncommitted events
- `isReconstructed`: boolean — whether this instance was produced by `constructVersion`/`constructBefore`
- `reconstructedFromVersion`: number — version of the instance it was reconstructed from
- `isRebased`: boolean — whether the stream contains a rebase
- `rebasedFromVersion`: number — version the aggregate was rebased from
- `state`: T *(protected)* — the current state; expose domain-specific getters off this

Static methods:
- `deserializeFromEvents(domainContext, aggregateType, stateFactory, eventData: ReadonlyArray<DomainEventData>)`: reconstruct an aggregate from serialized events
- `deserializeFromSnapshot(domainContext, aggregateType, stateFactory, stateSnapshot)`: reconstruct an aggregate from a snapshot

Instance methods:
- `serialize()`: AggregateRootData — serialize the aggregate (id, version, timestamps, and all events)
- `snapshot(...cloneKeys: ReadonlyArray<string>)`: T | object — snapshot of current state; `cloneKeys` names state properties to deep-clone via JSON instead of `Serializable` serialization
- `constructVersion(version: number)`: this — reconstruct the aggregate as of a specific version
- `constructBefore(dateTime: number)`: this — reconstruct the aggregate as of just before a timestamp
- `hasEventOfType(eventType)` / `hasRetroEventOfType(eventType)` / `hasCurrentEventOfType(eventType)`: boolean
- `getEventsOfType(eventType)` / `getRetroEventsOfType(eventType)` / `getCurrentEventsOfType(eventType)`: Array<TEventType>
- `clone(createdEvent: DomainEvent<T>, serializedEventMutatorAndFilter?: (event: { $name: string; }) => boolean)`: this — create a new aggregate seeded by `createdEvent`, replaying this aggregate's non-created events onto it; the optional callback can mutate each serialized event and return false to drop it
- `test()`: void — self-check that serialization, event replay, and snapshot round-trips all reproduce identical state; useful in tests
- `applyEvent(event: TDomainEvent)` *(protected)* — apply a new event; call from your aggregate's behavior methods
- `rebase(version: number, rebasedEventFactoryFunc: (defaultState: object, rebaseState: object, rebaseVersion: number) => TDomainEvent)` *(protected)* — collapse history up to `version` into a single rebase event produced by the factory function; override with a public method that supplies your aggregate's rebased event type

### AggregateFactory

Instantiates aggregates without hand-writing constructor plumbing.

- `constructor(aggregateType, domainContext, stateFactory)`
- `createFromEvents(events: ReadonlyArray<TDomainEvent>)`: T

### DomainEvent

Abstract base class for domain events. Generic over `<T extends AggregateState>`.

Properties:
- `aggregateId`: string — ID of the aggregate this event belongs to *(throws if accessed before the event is applied)*
- `id`: string — unique event identifier (`aggregateId-version`) *(throws if accessed before apply)*
- `userId`: string — ID of the user who triggered the event *(throws if accessed before apply)*
- `name`: string — event type name (derived from the class name; validated against `$name` on deserialization)
- `partitionKey`: string — same as `aggregateId` (n-eda compatibility)
- `refId`: string — same as `aggregateId` (n-eda compatibility)
- `refType`: string — *abstract*; the aggregate's type name (n-eda compatibility). Implement with a string literal, not an import of the aggregate class
- `occurredAt`: number — timestamp when the event occurred (epoch ms)
- `version`: number — version number of the event
- `isCreatedEvent`: boolean — whether this is the creation event

Methods:
- `apply(aggregate, domainContext, state)`: applies the event — stamps `userId`/`version`/`id`, overlays `$frozenDefaultState` for created events, invokes `applyEvent`, and updates `createdAt`/`updatedAt`. Called by the framework; you should not call this directly
- `serialize()`: DomainEventData — created events additionally carry `$frozenDefaultState`
- `applyEvent(state: T)` *(protected, abstract)* — implement your event-specific state mutation here. The created event must set `state.id`

### DomainEventData

Serialized event shape: `$aggregateId`, `$id`, `$userId`, `$name`, `$occurredAt`, `$version`, `$isCreatedEvent` (all optional/null on unapplied events), and `$frozenDefaultState` (created events only). Extend this interface with your event's own payload fields.

### AggregateRootData

Serialized aggregate shape: `$id`, `$version`, `$createdAt`, `$updatedAt`, `$events`.

### AggregateState

Base interface for aggregate state.

Properties:
- `typeVersion`: number *(readonly)* — version of the state *shape*; bump on breaking changes and migrate in the factory's `update()`
- `id`: string — unique identifier for the aggregate
- `version`: number — current version of the aggregate
- `createdAt`: number — creation timestamp (epoch ms)
- `updatedAt`: number — last update timestamp (epoch ms)
- `isRebased`: boolean — whether the aggregate was rebased
- `rebasedFromVersion`: number — version from which the aggregate was rebased

### AggregateStateFactory

Abstract base class for state factories. Generic over `<T extends AggregateState>`.

- `create()`: T *(abstract)* — produce the default state; must be deterministic (the framework verifies repeated calls are identical)
- `update(state: T)`: T — hook for migrating loaded state forward across `typeVersion`s; default is identity
- `deserializeSnapshot(snapshot: T)`: T — revive serialized value objects inside a snapshot (uses `AggregateStateHelper.deserializeSnapshotIntoState`)
- `createDefaultAggregateState()` *(protected)*: AggregateState — base-field defaults (`typeVersion: 1`, `isRebased: false`, etc.); spread this into your `create()` output

### AggregateStateHelper

Static utilities for working with state objects.

- `serializeStateIntoSnapshot(state, ...cloneKeys)`: object — serialize state (including nested `Serializable`s) into a plain snapshot; throws if a non-`DomainObject` with private fields is encountered
- `deserializeSnapshotIntoState(snapshot)`: object — revive registered `Serializable` types inside a snapshot
- `rebaseState(state, defaultState, rebaseState, rebaseVersion)`: void — layer a rebase snapshot over current defaults onto the state; call from your rebased event's `applyEvent`
- `fingerprintState(state)`: string — stable SHA-512 fingerprint of a state object with canonically sorted keys; intended for `create()` drift-guard tests

### DomainObject

Abstract base class for value objects (extends `Serializable`). Generic over `<TThis extends object, TDataKeys extends keyof TThis>` — `TThis` is the concrete subclass itself, `TDataKeys` the union of its `@serialize`d getter names.

- `constructor(data)` *(protected)* — `data`'s shape is derived from `TThis`/`TDataKeys` (use `DomainObjectData<TThis>`); on fresh construction, throws if `data` contains keys with no matching `@serialize` getter
- `serialize()`: `DomainObjectSerialized<TThis, TDataKeys>` — the plain deep serialized shape (nested domain objects as serialized data, `$typename` at every level), distinct from the instance-typed constructor input
- `equals(value)`: boolean — structural equality: same type name and identical serialized state
- `$data` *(type-only, always `undefined`)* — brand carrying the constructor-input shape for `DomainObjectData<T>`; never read it or list it in `TDataKeys`

### DomainObjectData

`DomainObjectData<T>` — the constructor-input data shape of a `DomainObject` subclass: its `@serialize`d getter types as-is, so nested domain objects are live instances. Use it to type the subclass's constructor parameter: `constructor(data: DomainObjectData<TodoDescription>)`.

### DomainObjectSerialized / SerializedValue

`DomainObjectSerialized<TThis, TDataKeys>` — what `serialize()` returns: the data keys mapped through `SerializedValue` plus `$typename`. `SerializedValue<V>` maps a value type to its wire/storage shape, mirroring exactly what the runtime does: nested domain objects → their serialized shapes (including as elements of a directly-held array), `Date` → ISO string, plain objects/arrays JSON-cloned property-wise.

**Design rule: a domain object — value object or entity, anything extending `DomainObject` — is always held directly or in a single-level array.** The type system enforces this in both directions. On the input side, a data key whose shape the runtime cannot faithfully serialize is poisoned to `never` in the constructor's parameter type, so a violating class is **unconstructible** — `new` simply doesn't compile. On the output side, the same positions are `never` in the serialized type.

**Legal data shapes** (construct and serialize freely): scalars (`string`/`number`/`boolean`), enums (numeric and string) and literal unions, `Date` (serializes as an ISO string), nullable/optional variants of any of these, plain data objects and arrays of all of the above (any depth, as long as no domain object is inside), domain objects held directly, and domain objects in a single-level array (`Array<VO>`, `ReadonlyArray<Entity>`).

**Violating shapes** (compile errors): `Map`/`Set`/`Promise` (JSON-clone to `{}`), functions, and domain objects buried beyond the runtime's reach, i.e. inside doubly-nested arrays (`Array<Array<DomainObject>>`) or inside plain-object properties (`{ foo: DomainObject }`). To model those, wrap the inner structure in a domain object of its own.

### DomainEntity

Abstract base class for entities (extends `DomainObject`). Generic over `<TThis extends { id: string }, TDataKeys extends keyof TThis>`; `"id"` is added to the data keys automatically, so the constructor data always includes `id: string`.

- `id`: string — unique identifier
- `equals(value)`: boolean — identity equality: same type name and same `id`, regardless of state
- `deepEquals(value)`: boolean — structural equality (same semantics as `DomainObject.equals`): same type name and identical serialized state

### DomainContext

Interface for domain context.

- `userId`: string *(readonly)* — ID of the current user

### ConfigurableDomainContext

`DomainContext` implementation with a mutable `userId`.

- `constructor(userId: string)`
- `userId`: string — gettable and settable

### DomainHelper

Static utilities.

- `now`: number — current epoch milliseconds
- `generateId(prefix: string)`: string — generate a sortable id of the form `pfx_<date><ulid>`; prefix must be exactly 3 alphabetic characters
- `aggregateTypeToSnakeCase(aggregateType)`: string — convert an aggregate class name to snake_case

### Org* variants

`OrgAggregateRoot`, `OrgAggregateState`, `OrgAggregateStateFactory`, `OrgDomainContext`, `OrgConfigurableDomainContext`, `OrgDomainEvent`, `OrgDomainEventData` — organization-scoped counterparts of the core types; see [Multi-tenancy](#multi-tenancy-org-types) above.

## Best Practices

1. **Event Design**
   - Keep events immutable; include only necessary data
   - Define an abstract per-aggregate event base class that implements `refType` with a string literal (never an import of the aggregate — circular dependency)
   - Use the `@serialize` decorator on the class (with your app's namespace) and on every payload getter
   - Set `data.$isCreatedEvent = true` in the created event's constructor, before calling `super(data)`
   - The created event's `applyEvent` must set `state.id`

2. **Aggregate Design**
   - Keep aggregates focused and cohesive; maintain consistency boundaries
   - Use a static `create(...)` factory method that builds the created event and instantiates via `AggregateFactory`
   - Mutate state only through `applyEvent(...)` from behavior methods
   - Validate all public method inputs using `given`

3. **State Management**
   - Keep `create()` deterministic — same output on every call
   - Bump `typeVersion` on breaking state-shape changes and migrate in `update()`
   - Add a drift-guard test on `create()`'s fingerprint (`AggregateStateHelper.fingerprintState`) so default changes are deliberate
   - Use value objects (extending `DomainObject`) for structured state fields so snapshots serialize correctly

4. **Domain Organization**
   - Keep related files close together; use clear naming conventions
   - Separate events and value objects into their own directories
   - Call `aggregate.test()` in your test suite to verify serialization/replay/snapshot round-trips

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues and feature requests, please use the GitHub issue tracker.
