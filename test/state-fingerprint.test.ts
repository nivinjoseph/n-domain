import "@nivinjoseph/n-ext";
import assert from "node:assert";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";
import { AggregateStateHelper } from "../src/index.js";
import { TodoState, TodoStateFactory } from "./domain/todo-state.js";


/**
 * Shape-manifest drift guard: a git-persisted description of each PRODUCTION factory's create()
 * output — the explicit sorted key list plus a SHA-512 value fingerprint.
 *
 * - A key REMOVAL (or rename) against the manifest fails with a message spelling out the migration
 *   obligation: stored artifacts exist in the old shape, so a step must be added to defineMigrations().
 * - A key ADDITION or a value-only change fails the fingerprint; additive evolution is free, so this
 *   is acknowledged by regenerating — but it stays LOUD in CI because changing an existing create()
 *   default still rewrites replayed history for pre-freeze streams.
 *
 * Curated to production factories only. MigratedTodoStateFactory is an intentional migration double
 * and must never be baselined here.
 *
 * Re-baseline after an intentional change with: UPDATE_FINGERPRINTS=1 yarn test
 */
const productionFactories: Record<string, () => TodoState> = {
    TodoStateFactory: () => new TodoStateFactory().create()
};

const goldenPath = fileURLToPath(new URL("./state-shapes.json", import.meta.url));
const update = process.env["UPDATE_FINGERPRINTS"] === "1";

interface ShapeManifestEntry
{
    keys: Array<string>;
    fingerprint: string;
}


await describe("create() state-shape drift guard", async () =>
{
    if (update)
    {
        const regenerated: Record<string, ShapeManifestEntry> = {};
        for (const [name, create] of Object.entries(productionFactories))
            regenerated[name] = AggregateStateHelper.describeShape(create());

        writeFileSync(goldenPath, `${JSON.stringify(regenerated, null, 4)}\n`, "utf-8");
        console.log(`[drift guard] wrote golden shape manifest to ${goldenPath}`);
    }

    assert.ok(existsSync(goldenPath),
        `golden shape manifest is missing; generate it with: UPDATE_FINGERPRINTS=1 yarn test`);
    const golden = JSON.parse(readFileSync(goldenPath, "utf-8")) as Record<string, ShapeManifestEntry>;

    for (const [name, create] of Object.entries(productionFactories))
    {
        await test(`${name}.create() keys have not been removed or renamed`, () =>
        {
            const current = AggregateStateHelper.describeShape(create());
            const goldenEntry = golden[name] as ShapeManifestEntry | undefined;
            assert.ok(goldenEntry != null, `no golden manifest entry for ${name}`);

            const removedKeys = goldenEntry.keys.where(t => !current.keys.contains(t));
            assert.deepStrictEqual(removedKeys, [],
                `${name}.create() no longer has keys [${removedKeys.join(", ")}] that are in the committed manifest. `
                + `Stored artifacts (snapshots, frozen defaults, rebase baselines) exist in that shape — removing or `
                + `renaming a key REQUIRES a migration step in defineMigrations() before re-baselining with: `
                + `UPDATE_FINGERPRINTS=1 yarn test`);
        });

        await test(`${name}.create() output has not drifted`, () =>
        {
            const current = AggregateStateHelper.describeShape(create());
            assert.strictEqual(current.fingerprint, golden[name].fingerprint,
                `${name}.create() output changed. Changing an existing create() default silently rewrites the `
                + `materialized state of pre-freeze historical streams on replay; adding a key is free but must be `
                + `acknowledged. If this change is intentional, re-baseline with: UPDATE_FINGERPRINTS=1 yarn test`);
        });
    }

    await test("golden manifest has no stale entries", () =>
    {
        const staleEntries = Object.keys(golden).where(t => !Object.keys(productionFactories).contains(t));
        assert.deepStrictEqual(staleEntries, [],
            `state-shapes.json contains entries [${staleEntries.join(", ")}] with no registered production factory. `
            + `Re-add the factory to productionFactories, or if its removal is intentional re-baseline with: `
            + `UPDATE_FINGERPRINTS=1 yarn test`);
    });

    await test("the guard trips when an existing create() default changes", () =>
    {
        class DriftedTodoStateFactory extends TodoStateFactory
        {
            public override create(): TodoState
            {
                const state = super.create();
                state.isCompleted = true; // flip an existing untouched-field default
                return state;
            }
        }

        const base = AggregateStateHelper.describeShape(new TodoStateFactory().create());
        const drifted = AggregateStateHelper.describeShape(new DriftedTodoStateFactory().create());
        assert.notStrictEqual(drifted.fingerprint, base.fingerprint,
            "a changed create() default must produce a different fingerprint");
        assert.deepStrictEqual(drifted.keys, base.keys,
            "a value-only change must not alter the key manifest");
    });

    await test("shape description is stable across repeated calls", () =>
    {
        const a = AggregateStateHelper.describeShape(new TodoStateFactory().create());
        const b = AggregateStateHelper.describeShape(new TodoStateFactory().create());
        assert.deepStrictEqual(a, b);
    });
});
