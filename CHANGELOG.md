# Changelog

All notable changes to `@nivinjoseph/n-domain` are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). This file was reconstructed from git
history in August 2026; entries before 3.1.0 are summarized best-effort.

## [Unreleased]

### Changed
- **Breaking:** `DomainObject` and `DomainEntity` are now generic over `<TThis, TDataKeys>` (the
  subclass itself and the union of its `@serialize`d getter names) with no defaults; constructor
  data is typed via the new `DomainObjectData<T>` export. Existing `extends DomainObject` /
  `extends DomainEntity` declarations must add the type arguments.
- `DomainObject`'s constructor now validates at runtime (fresh constructions only) that every
  property in `data` corresponds to an `@serialize` decorated getter.
- **Breaking (types only):** `DomainObject.serialize()` now returns
  `DomainObjectSerialized<TThis, TDataKeys>` — the honest deep serialized shape (nested domain
  objects as plain serialized data with `$typename` at every level, `Date` as ISO string) —
  instead of claiming instance types for nested domain objects. Constructor input stays
  instance-typed via `DomainObjectData<T>` (now recovered from the type-only `$data` brand).
  Code that called instance methods on serialized output no longer compiles (it crashed at
  runtime before). Zero runtime change.

### Added
- `DomainObjectData<T>` exported from the package barrel.
- `DomainObjectSerialized<TThis, TDataKeys>` and `SerializedValue<V>` exported from the package
  barrel — the serialized-output types described above. `SerializedValue` mirrors the runtime
  exactly: domain objects held directly or in a single-level array serialize properly; positions
  the runtime would JSON-mangle (`Map`/`Set`/`Promise`, domain objects inside `Array<Array<...>>`
  or inside plain-object properties) type as `never`, surfacing them as compile errors.
- Documentation overhaul: TSDoc across the public API, `llms.txt`, `CLAUDE.md`, this changelog,
  and refreshed README examples.

## [3.2.6] - 2026-07-24

### Added
- `DomainEntity.deepEquals()` — structural comparison (same semantics as `DomainObject.equals`),
  complementing the identity-based `equals()`.

## [3.2.5] - 2026-07-12

### Changed
- `DomainEntity.equals()` is now identity-based: same type name and same `id`, regardless of state.
- README documentation updates.

## [3.2.4] - 2026-07-09

### Removed
- Removed a defective method from `AggregateFactory`.

## [3.2.3] - 2026-07-01

### Added
- **Replay safety:** created events now freeze the state factory's pristine `create()` output into
  `$frozenDefaultState`; on replay it overlays the base state so fields no event writes are sourced
  from the stream rather than from a possibly-changed future `create()`.
- `AggregateStateHelper.fingerprintState()` — canonical SHA-512 fingerprint of a state object, for
  drift-guard tests on `create()` defaults.
- Explicit `typeVersion` migration check: the `AggregateRoot` constructor throws when loaded state,
  after `update()`, is not at the current `typeVersion`.

## [3.2.2] - 2026-06-13

### Changed
- Relaxed snapshot serialization (plain JSON objects in state no longer require `Serializable`).

## [3.2.1] - 2026-06-03

### Changed
- Maintenance release.

## [3.2.0] - 2026-06-03

### Added
- `AggregateFactory` — the preferred way to instantiate aggregates from events.

## [3.1.1] / [3.1.2] - 2026-06-02 / 2026-06-03

### Fixed
- Type fixes.

## [3.1.0] - 2026-06-02

### Added
- Multi-tenancy `Org*` variants: `OrgAggregateRoot`, `OrgAggregateState`,
  `OrgAggregateStateFactory`, `OrgDomainContext`, `OrgConfigurableDomainContext`, `OrgDomainEvent`,
  `OrgDomainEventData`.

## 3.0.x - 2024-01 through 2026-05

Summarized: migration to ESM (`"type": "module"`) and TypeScript 5 standard decorators, `n-util`
upgrades, equals-behavior changes, build/tooling modernization (Yarn 4, `node:test`), and
maintenance fixes.

## Pre-3.0

Summarized: 1.x and 2.x established the core model — event-sourced `AggregateRoot`, `DomainEvent`,
state factories, snapshots, `DomainObject`/`DomainEntity`, and `DomainHelper` id generation.
