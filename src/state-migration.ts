// public
/**
 * One step in an aggregate's state-schema migration chain. Step `i` in the list returned by
 * `AggregateStateFactory.defineMigrations()` migrates a stored state document from schema
 * version `i + 1` to `i + 2`.
 *
 * `migrate` receives the SERIALIZED domain-key payload of a stored state artifact (snapshot,
 * created-event frozen default, or rebase baseline): plain `$typename`-tagged JSON, with the
 * framework base fields and `$`-metadata already stripped. The payload is a private deep copy —
 * steps may freely mutate it in place. It must be a pure transform — no dependence on live
 * state, other events, or replay position — and must return the payload in the next version's
 * shape. Because frozen defaults may predate later fields, a step must tolerate the absence of
 * keys that did not exist at its source version.
 */
export interface StateMigration
{
    migrate(payload: Record<string, any>): Record<string, any>;
}
