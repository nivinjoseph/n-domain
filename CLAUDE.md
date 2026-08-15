# n-domain — contributor/agent guide

TypeScript library for DDD + Event Sourcing (`@nivinjoseph/n-domain`). ESM only, Node >= 24.10.

## Where to look first

- `llms.txt` — condensed API guide and, critically, the **rules the type system does not enforce** (serialization decorators, created-event conventions, replay preconditions). Read it before writing any consumer-style code.
- `test/domain/` — the canonical reference implementation (a complete Todo aggregate). When README and code disagree, trust these files.
- `README.md` — concepts and the full per-export API reference.

## Layout

- `src/` — flat, one file per exported type; `src/index.ts` is the barrel (21 exports + a side-effect import of `@nivinjoseph/n-ext`).
- `test/` — `node:test` suites; `test/domain/` holds the shared fixtures.
- `dist/` — published build output (`ts-build-dist`). Compiled `.js` also sits beside sources in `src/`/`test/` (gitignored) because tests run the in-place compilation.

## Build & test (Yarn 4)

- `yarn ts-build` — typecheck + lint + compile in place (`tsconfig.json`).
- `yarn test` — compiles, then runs `node --test ./test/**/*.test.js`. Tests exercise the compiled `.js`, so always compile before running tests.
- `yarn ts-build-dist` — build the publishable `dist/` (`ts-config-dist.json`).

## Conventions & maintenance rules

- Runtime contracts are expressed with `given(...)` from `@nivinjoseph/n-defensive`; follow that style.
- Standard ES2023+ decorators (no `experimentalDecorators`); serialization metadata lives under `Symbol.metadata` via `@nivinjoseph/n-util`.
- `AggregateState` base fields are duplicated in `clearBaseState()` (`src/aggregate-state.ts`) — changing one requires changing the other.
- Event class names are persisted identities; never rename an event class without a migration story.
- **Docs must move with the API**: any public-signature change requires updating the README API reference, `llms.txt`, and the TSDoc on the changed member, plus a `CHANGELOG.md` entry.
