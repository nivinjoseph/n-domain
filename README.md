# n-domain

## Overview

n-domain is a TypeScript framework that provides a robust foundation for implementing business logic using Domain-Driven Design (DDD) and Event Sourcing patterns. It helps you create maintainable and scalable domain models while enforcing best practices in domain-driven design.

## Features

- **Domain-Driven Design Support**: Built-in abstractions for DDD concepts like Aggregates, Entities, Value Objects, and Domain Events
- **Event Sourcing**: Native support for event-sourced aggregates, snapshots, rebasing, and point-in-time reconstruction
- **Replay Safety**: Created events freeze the aggregate's initial defaults so replays are isolated from future code changes; a shape-manifest helper supports drift-guard tests
- **Schema Migration**: version-stamped stored artifacts (snapshots, frozen defaults, rebase baselines) upcast through the factory's migration chain at ingress, with loud shape-conformance guards
- **Multi-Tenancy**: `Org*` variants of the core types that scope aggregates to an organization
- **Type Safety**: Written in TypeScript with strong typing support

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

    // rebase() is protected on AggregateRoot; expose it by overriding with your rebase event
    public override rebase(version: number): void
    {
        super.rebase(version, (baseline, rebaseVersion) =>
            new TodoRebased({ $baseline: baseline, $rebaseVersion: rebaseVersion }));
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

#### Schema migrations

Live state is never migrated — it is *computed* by current code (base = `create()`, then current-code `applyEvent` over the stream), so it has no single "from version". What DOES get migrated are the **stored state artifacts**: snapshots, the frozen default state on created events, and rebase baselines. Each one is stamped with `$schemaVersion` metadata at write time and upcast through the factory's migration chain at its ingress point, *before* the data merges into live state.

The schema version is derived, never declared: `schemaVersion === defineMigrations().length + 1`. A version bump without a migration step (or a step without a bump) is unrepresentable.

- **Additive changes are free.** Adding a field with a default needs no step — artifacts missing the key fall through to the current `create()` default.
- **Renames, removals, and retypes need a migration step.** Without one, an old-shape artifact fails LOUDLY at load (keys that don't exist on the current shape throw), instead of loading silently corrupted state. The state also refuses to `snapshot()` while carrying unknown keys, so old-shape residue can never be laundered into a new snapshot.

```typescript
export class TodoStateFactory extends AggregateStateFactory<TodoState>
{
    public create(): TodoState
    {
        return {
            ...this.createDefaultAggregateState(),
            title: null as any, // schema version 2: renamed from `legacyTitle`
            description: null,
            isCompleted: false
        };
    }

    protected override defineMigrations(): ReadonlyArray<StateMigration>
    {
        return [
            {
                // v1 -> v2: legacyTitle renamed to title. Steps are pure transforms on the
                // SERIALIZED domain-key payload and must tolerate absent source keys.
                migrate: (payload) =>
                {
                    if ("legacyTitle" in payload)
                    {
                        payload["title"] = payload["legacyTitle"];
                        delete payload["legacyTitle"];
                    }
                    return payload;
                }
            }
        ];
    }
}
```

Artifacts persisted before schema versioning existed carry no stamp and are treated as schema version 1 (legacy snapshots' in-band `typeVersion` is honored as the stamp). Migration steps are applied at read time only — the store is never rewritten. To stop paying the upcast chain on a hot stream (or to physically shed an old shape), rebase it: the new baseline is written at the current schema version.

Note on event payloads: they are stamped with `$schemaVersion` too, but their evolution remains **tolerant-reader** — event constructors read old payload shapes forever (optional fields, read-both-keys on renames). The stamp preserves the option of versioned event upcasting later.

### Replay safety: frozen created-event defaults

When a new aggregate is created, the pristine output of the state factory's `create()` (base fields stripped, stamped with `$schemaVersion`) is frozen into the created event and serialized as `$frozenDefaultState`. On every future replay, this frozen payload is upcast through the migration chain and overlaid as the base layer before events apply.

This means fields that no event ever writes are sourced from the **stream** rather than from a possibly-changed future `create()` — changing a default in `create()` no longer silently rewrites historical aggregates on replay. Brand-new fields added to `create()` later still fall through to the current default (additive evolution is preserved). Only created events carry this payload; other events' serialized shape gains only the `$schemaVersion` stamp.

#### Drift guard

Because changing an *existing* default in `create()` is a meaningful (and easy-to-miss) act, `AggregateStateHelper.describeShape()` produces a canonical description of a state's shape: the sorted key list plus a stable SHA-512 value fingerprint. The intended pattern is a shape-manifest drift-guard test: persist the manifest of `create()` in source control and fail the test when it changes unexpectedly — with a key removal/rename failing specifically with the migration-step obligation, and a value-only change failing the fingerprint (acknowledged by regenerating).

```typescript
import { AggregateStateHelper } from "@nivinjoseph/n-domain";

const EXPECTED = { keys: ["..."], fingerprint: "..." }; // checked into source control

test("TodoStateFactory.create() shape has not drifted", () =>
{
    const shape = AggregateStateHelper.describeShape(new TodoStateFactory().create());
    assert.deepStrictEqual(shape.keys, EXPECTED.keys);       // removal/rename => write a migration step
    assert.strictEqual(shape.fingerprint, EXPECTED.fingerprint); // value change => acknowledge deliberately
});
```

### Domain Objects and Entities

- **`DomainObject`** — base class for value objects. `equals()` is **structural**: two instances are equal if they have the same type and identical serialized state.
- **`DomainEntity`** — base class for entities (has an `id`). `equals()` is **identity-based**: two instances are equal if they have the same type and the same `id`, regardless of state.

```typescript
import { given } from "@nivinjoseph/n-defensive";
import { serialize } from "@nivinjoseph/n-util";
import { DomainObject } from "@nivinjoseph/n-domain";


@serialize("App")
export class TodoDescription extends DomainObject
{
    private readonly _description: string;

    @serialize
    public get description(): string { return this._description; }

    public constructor(data: { description: string; })
    {
        super(data);
        const { description } = data;
        given(description, "description").ensureHasValue().ensureIsString();
        this._description = description;
    }
}
```

### Multi-tenancy (`Org*` types)

For organization-scoped domains, use the `Org*` variants. They mirror the core types and additionally thread an `organizationId` through the context, state, events, and aggregate:

- `OrgDomainContext` — `DomainContext` plus `organizationId: string`
- `OrgConfigurableDomainContext` — `ConfigurableDomainContext` plus a settable `organizationId`; constructed with `(userId, organizationId)`
- `OrgAggregateState` — `AggregateState` plus `organizationId: string`
- `OrgAggregateStateFactory` — constructed with an `OrgDomainContext`; `createDefaultAggregateState()` stamps `organizationId` into the state
- `OrgDomainEvent` / `OrgDomainEventData` — events carry `$organizationId`; on apply, the event's `organizationId` is validated against the state's and an exception is thrown on mismatch
- `OrgAggregateRoot` — exposes `organizationId` and requires an `OrgDomainContext`; `applyEvent` only accepts `OrgDomainEvent`s

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
- `rebase(version: number, rebasedEventFactoryFunc: (baseline: object, rebaseVersion: number) => TDomainEvent)` *(protected)* — collapse history up to `version` into a single rebase event; the framework produces the stamped baseline (the complete state at `version`) and the factory function supplies your aggregate's `RebaseEvent` subclass. On replay the baseline RESETS the state (all domain keys cleared, then current defaults, then the upcast baseline), so no residue from earlier overlays survives. Also serves as the re-baseline for breaking shape changes: the new baseline is written at the current schema version, so the rebased stream stops paying the upcast chain

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
- `apply(aggregate, domainContext, state)`: applies the event — stamps `userId`/`version`/`id`, invokes `applyEvent`, and updates `createdAt`/`updatedAt`. The `$frozenDefaultState` overlay for created events is performed by the `AggregateRoot` replay seam (which owns the state factory and upcasts the payload) before `apply` runs. Called by the framework; you should not call this directly
- `serialize()`: DomainEventData — new events carry `$schemaVersion`; created events additionally carry `$frozenDefaultState`
- `applyEvent(state: T)` *(protected, abstract)* — implement your event-specific state mutation here. The created event must set `state.id`

### RebaseEvent

Abstract framework-owned rebase event (extends `DomainEvent`). Subclasses contribute ONLY class identity (the `@serialize` name binding) and `refType` — `applyEvent` is a sealed no-op because the baseline is framework-applied with RESET semantics at the replay seam.

- `baseline`: object — complete base-stripped state at the rebase version, stamped with `$schemaVersion` (serialized as `$baseline`)
- `rebaseVersion`: number — the version history was collapsed to (serialized as `$rebaseVersion`)

For organization-scoped aggregates use `OrgRebaseEvent` (extends `OrgDomainEvent`, same contract) — it carries `$organizationId` and passes `OrgAggregateRoot`'s event guard; the framework recognizes both classes at the rebase seams.

### DomainEventData

Serialized event shape: `$aggregateId`, `$id`, `$userId`, `$name`, `$occurredAt`, `$version`, `$isCreatedEvent` (all optional/null on unapplied events), `$schemaVersion` (stamped on new events; legacy stored events lack it and are never retro-stamped), and `$frozenDefaultState` (created events only). Extend this interface with your event's own payload fields.

### AggregateRootData

Serialized aggregate shape: `$id`, `$version`, `$createdAt`, `$updatedAt`, `$events`.

### AggregateState

Base interface for aggregate state. The schema version is NOT part of the state — it lives on the factory (derived from the migration chain) and travels as `$schemaVersion` metadata on stored artifacts.

Properties:
- `id`: string — unique identifier for the aggregate
- `version`: number — current version of the aggregate
- `createdAt`: number — creation timestamp (epoch ms)
- `updatedAt`: number — last update timestamp (epoch ms)
- `isRebased`: boolean — whether the aggregate was rebased
- `rebasedFromVersion`: number — version from which the aggregate was rebased

`BASE_STATE_KEYS` exports this key list; everything else on a state is a domain key.

### StateMigration

One step in the migration chain: `migrate(payload: Record<string, any>): Record<string, any>` — a pure transform on the serialized domain-key payload of a stored artifact, moving it one schema version forward. Must tolerate absent source keys.

### AggregateStateFactory

Abstract base class for state factories. Generic over `<T extends AggregateState>`.

- `create()`: T *(abstract)* — produce the default state; must be deterministic (the framework verifies repeated calls are identical)
- `schemaVersion`: number — derived: `defineMigrations().length + 1`
- `defineMigrations()` *(protected)*: ReadonlyArray<StateMigration> — append-only ordered migration chain; entry `[i]` migrates version `i + 1` to `i + 2`. Default `[]`
- `preVersioningSchemaVersion`: number — schema version assumed for stored artifacts with no version stamp (default 1); override only if your pre-4.0 estate shipped `typeVersion > 1`
- `createDefaultAggregateState()` *(protected)*: AggregateState — base-field defaults (`isRebased: false`, etc.); spread this into your `create()` output
- `upcastStateDocument(payload, declaredVersion, kind)` / `ingestSnapshot(raw)` — framework drivers (internal); enforce the ingress guards: an artifact declaring a version newer than the code throws, and post-upcast keys that don't exist on the current shape throw

### AggregateStateHelper

Static utilities for working with state objects.

- `serializeStateIntoSnapshot(state, ...cloneKeys)`: object — serialize state (including nested `Serializable`s) into a plain snapshot; throws if a non-`DomainObject` with private fields is encountered
- `deserializeSnapshotIntoState(snapshot)`: object — revive registered `Serializable` types inside a snapshot
- `rebaseState(state, defaultState, rebaseState, rebaseVersion)`: void — **deprecated**; legacy MERGE apply path kept only so pre-4.0 user-defined rebase events already persisted in streams keep replaying unchanged
- `describeShape(state)`: { keys, fingerprint } — canonical shape description (sorted key list + SHA-512 value fingerprint); feeds the shape-manifest drift guard
- `fingerprintState(state)`: string — stable SHA-512 fingerprint of a state object with canonically sorted keys

### DomainObject

Abstract base class for value objects (extends `Serializable`).

- `equals(value)`: boolean — structural equality: same type name and identical serialized state

### DomainEntity

Abstract base class for entities (extends `DomainObject`). Constructed with `{ id: string }` in its data.

- `id`: string — unique identifier
- `equals(value)`: boolean — identity equality: same type name and same `id`, regardless of state

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

`OrgAggregateRoot`, `OrgAggregateState`, `OrgAggregateStateFactory`, `OrgDomainContext`, `OrgConfigurableDomainContext`, `OrgDomainEvent`, `OrgDomainEventData`, `OrgRebaseEvent` — organization-scoped counterparts of the core types; see [Multi-tenancy](#multi-tenancy-org-types) above.

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
   - Adding fields (with defaults) is free; renaming/removing/retyping a field REQUIRES a migration step in `defineMigrations()` — old-shape artifacts fail loudly at load without one
   - Add a shape-manifest drift-guard test on `create()` (`AggregateStateHelper.describeShape`) so shape and default changes are deliberate
   - Use value objects (extending `DomainObject`) for structured state fields so snapshots serialize correctly
   - Rebase hot streams after shape changes so they stop paying the upcast chain (the new baseline is written at the current schema version)

4. **Domain Organization**
   - Keep related files close together; use clear naming conventions
   - Separate events and value objects into their own directories
   - Call `aggregate.test()` in your test suite to verify serialization/replay/snapshot round-trips

## Upgrading from 3.x

Version 4 is a breaking redesign of schema migration. API changes:

- `AggregateState.typeVersion` is **deleted** (schema version now lives on the factory, derived from the migration chain, and travels as `$schemaVersion` artifact metadata — never in live state).
- `AggregateStateFactory.update()` and the constructor typeVersion guard are **deleted** — end-of-load state migration was sound only for snapshots and silently no-oped on replayed streams; migration now happens per stored artifact at its ingress. Port any `update()` logic into `defineMigrations()` steps (note the altitude change: steps see serialized payloads, not live state).
- `AggregateStateFactory.deserializeSnapshot()` is **deleted** (absorbed into the framework snapshot ingress).
- `rebase()`'s factory function signature changed to `(baseline, rebaseVersion) => TDomainEvent`, and rebase events must now extend the framework-owned `RebaseEvent` (RESET semantics; the old defaultState/rebaseState merge overlay is gone for new rebases).

Persisted data needs **no rewrite** — all migration is read-time:

- Old snapshots keep loading: their in-band `typeVersion` is honored as the version stamp and dropped before state assembly. Stored `typeVersion` values are interpreted as positions in the migration chain, so `defineMigrations()` must cover the historical numbering — a snapshot whose `typeVersion` exceeds the chain fails with a dedicated "port the pre-4.0 update() chain" error.
- Old created events (with or without `$frozenDefaultState`) and old event payloads replay unchanged; unstamped artifacts are treated as schema version 1 by default. If your 3.x estate ever shipped `typeVersion > 1`, unstamped frozen defaults were written at that later shape — declare it by overriding the factory's `preVersioningSchemaVersion` so they enter the chain at the right position (snapshots need no declaration; they are self-describing).
- Old user-defined rebase events keep replaying through the deprecated `AggregateStateHelper.rebaseState` merge path — keep the legacy event class around (its `applyEvent` calling the deprecated helper) until those streams are re-rebased. **Re-rebase legacy-rebased streams BEFORE shipping any rename/removal migration step**: their payloads bypass the migration chain, and once a step ships, loading such a stream fails loudly at replay (end-of-replay conformance guard) until it is re-rebased under the pre-migration factory.

Rollback caveat: artifacts written by v4 (stamped snapshots, `RebaseEvent` baselines) are not readable by 3.x — treat the upgrade as one-way per aggregate type, or hold off snapshotting/rebasing during a soak window.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues and feature requests, please use the GitHub issue tracker.
