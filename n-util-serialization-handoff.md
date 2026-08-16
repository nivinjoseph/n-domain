# HANDOFF — n-util: make `serialize()` return an honest deep DTO type

> Execute this in the n-util repo (`/Users/nivin/Development/github/n-util`). It is self-contained;
> no other context is required. A separate follow-up will adapt n-domain after this ships.
>
> **STATUS NOTE (2026-08-16):** n-domain has since solved this for its own `DomainObject` hierarchy
> locally (deep DTO type in the heritage clause + re-declared instance-typed constructor + `$data`
> brand; see n-domain `src/domain-object.ts`). This n-util change is therefore now OPTIONAL — it
> extends the fix to ALL Serializable subclasses ecosystem-wide (DomainEvent, AggregateRoot, n-app
> types, …) and would let n-domain replace its local `SerializedValue` with n-util's. Still worth
> doing, but no longer blocking anything.

## Why (context from the n-domain session that produced this)

`Serializable<TData>`'s single generic serves two roles: **constructor input** (nested properties are
*instance* types — correct today) and **`serialize()` output** (should be plain deep DTO shapes — currently
lies: for nested Serializables the type claims instance types while the runtime value is plain JSON data.
`serialized.nested.equals(...)` compiles and crashes). Discovered via 3-level nested value objects in
n-domain. Decision: fix at the root here. **This is a type-only change — zero runtime behavior change.**
It is a breaking *type* change for consumers (n-domain, n-app, …) → **major version bump**.

## Repo facts

- master, v5.0.0. The tree already has unrelated uncommitted changes (README.md, dist/dto-factory*) — leave them as they are, do not revert or absorb them into commits.
- Build/test: `yarn ts-build` (compile + lint), `yarn test` (build + `node --test` over compiled `test/**/*.test.js`).
- Do NOT run `publish-package` (it commits, pushes, and publishes) — the owner publishes manually.
- Only internal consumers of `Serializable` typing: `src/dto-factory.ts` and `src/index.ts`.

## Design (already verified in a scratchpad; key pitfalls listed below)

### 1. `src/serializable.ts`

Add exported types (branches deliberately mirror what `serialize()`/JSON-cloning actually does at runtime,
consistent with the existing `DtoValue` in dto-factory.ts):

```ts
export type Serialized<V> =
    V extends null | undefined ? null :
    V extends Serializable<infer D> ? SerializedShape<D> :
    V extends Date ? string :                                  // JSON round-trip yields ISO string
    V extends Map<any, any> | Set<any> | Promise<any> ? never : // JSON-cloning these yields {}
    V extends ReadonlyArray<infer E> ? Array<Serialized<E>> :
    V extends object ? { -readonly [K in keyof V]: Serialized<V[K]>; } :
    V;

export type SerializedShape<TData extends object> =
    { [K in keyof TData]: Serialized<TData[K]>; } & { $typename: string; };

export type DataOf<T extends Serializable<object>> = T extends Serializable<infer D> ? D : never;
```

In the `Serializable` class:
- Add a type-only brand as the first member: `declare private readonly __dataBrand: TData;`
  **Why required:** once `serialize()` no longer returns `TData`, `V extends Serializable<infer D>` has
  nothing to infer `D` from (constructors aren't part of instance types). The brand restores inference —
  including for the *existing* `DtoValue` conditional, which would otherwise silently break.
  `declare` ⇒ no emit, no runtime footprint. `readonly` matters for variance.
- Change `public serialize(): TData` → `public serialize(): SerializedShape<TData>`; at the final return,
  cast (`as SerializedShape<TData>` — via `unknown` if tsc demands). Runtime body untouched.

### 2. `src/dto-factory.ts`

`DtoValue`'s Serializable branch is currently `V extends Serializable<infer TData> ? TData & { $typename: string; }`
— shallow (nested Serializables inside `TData` stay instance-typed, since the result isn't recursed).
Replace with `V extends Serializable<object> ? Serialized<V> :` for deep correctness and one shared
source of truth. Update the branch's doc comment accordingly.

### 3. `src/index.ts` — export `Serialized`, `SerializedShape`, `DataOf` from `./serializable.js`.

### 4. `package.json` — version `5.0.0` → `6.0.0` (breaking type change).

## Pitfalls (hit and solved during design verification — do not rediscover them)

- `serialize(): Serialized<this>` triggers **TS2577** (return type circularly references itself).
  Use `SerializedShape<TData>`.
- Do NOT try to express the output type in the heritage clause or as a generic default — mapped types with
  indexed access / conditional defaults in heritage positions hit **TS2310** recursion. Method return
  position is resolved lazily and is safe.
- `Serialized<V>` is distributive (bare `V` in the conditional) — that is intended, so `string | null`
  maps to `string | null`.
- The homomorphic plain-object branch preserves optionality (`?`) — intended.

## Tests

Existing `test/serializable.test.ts` must still compile and pass — it consumes `serialize()` output
extensively and is the canary for unintended breaks (some type assertions in it may legitimately need
updating from instance-typed to DTO-typed expectations; runtime assertions must not change).

Add a typing-focused test (same file or a new `test/serialized-typing.test.ts`), using classes nested
3 levels (e.g. `Workplace` → `Address` → `GeoCoordinate`, decorated with `@serialize("Test")` +
`@serialize` getters):
- Runtime: serialize → JSON round-trip → `Deserializer.deserialize` → `instanceof` at every level, deep
  value equality.
- Type-level (compile-time assertions):
  - `const dto = instance.serialize();` then `dto.address.coordinate.lat` type-checks (deep data keys resolve);
  - `dto.address.$typename` is `string` at every nesting level;
  - `// @ts-expect-error` on `dto.address.serialize()` (or `.getTypeName()`) — instance methods must not
    exist on serialized output;
  - `// @ts-expect-error` on assigning `dto.address` to a variable of the nested class's instance type;
  - `DataOf<Workplace>` still yields the instance-typed constructor shape (assign a valid literal with a
    real nested instance; `@ts-expect-error` on a plain-DTO literal in its place).
- `Date` behavior: a Serializable with a `Date`-typed decorated getter — serialized property types as
  `string` (matches the JSON-clone runtime).

## Verification

1. `yarn ts-build` — clean compile + lint.
2. `yarn test` — full suite passes.
3. Do not commit/publish unless the owner asks; report what changed and stop.

## After this ships (context only — NOT part of this task)

n-domain will: bump to n-util v6, replace its local `SerializedValue<V>` with n-util's `Serialized<V>`,
reconcile `DomainObject`'s heritage type with the new base return type, update the
`DomainEvent.serialize()` override's return type, and fix any compile fallout.
Do not attempt any of that from the n-util repo.
