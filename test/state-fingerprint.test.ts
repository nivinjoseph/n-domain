import "@nivinjoseph/n-ext";
import assert from "node:assert";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";
import { AggregateStateHelper } from "../src/index.js";
import { TodoState, TodoStateFactory } from "./domain/todo-state.js";


/**
 * Drift guard (option 3): a git-persisted SHA-512 fingerprint of each PRODUCTION factory's create() output.
 * If a fingerprint changes, the test fails — forcing a conscious decision, because changing a create()
 * default silently rewrites the materialized state of every historical stream on replay.
 *
 * Curated to production factories only. UnmigratedTodoStateFactory / MigratedTodoStateFactory are intentional
 * typeVersion-bump drift doubles and must never be baselined here.
 *
 * Re-baseline after an intentional change with: UPDATE_FINGERPRINTS=1 yarn test
 */
const productionFactories: Record<string, () => TodoState> = {
    TodoStateFactory: () => new TodoStateFactory().create()
};

const goldenPath = fileURLToPath(new URL("./state-fingerprints.json", import.meta.url));
const update = process.env["UPDATE_FINGERPRINTS"] === "1";


await describe("create() default-state drift guard", async () =>
{
    if (update)
    {
        const regenerated: Record<string, string> = {};
        for (const [name, create] of Object.entries(productionFactories))
            regenerated[name] = AggregateStateHelper.fingerprintState(create());

        writeFileSync(goldenPath, `${JSON.stringify(regenerated, null, 4)}\n`, "utf-8");
        console.log(`[drift guard] wrote golden fingerprints to ${goldenPath}`);
    }

    assert.ok(existsSync(goldenPath),
        `golden fingerprint file is missing; generate it with: UPDATE_FINGERPRINTS=1 yarn test`);
    const golden = JSON.parse(readFileSync(goldenPath, "utf-8")) as Record<string, string>;

    for (const [name, create] of Object.entries(productionFactories))
    {
        await test(`${name}.create() output has not drifted`, () =>
        {
            const fingerprint = AggregateStateHelper.fingerprintState(create());
            assert.strictEqual(fingerprint, golden[name],
                `${name}.create() output changed. Changing a create() default silently rewrites the materialized `
                + `state of every historical stream on replay. If this change is intentional, migrate existing `
                + `streams (update()/rebase) and re-baseline with: UPDATE_FINGERPRINTS=1 yarn test`);
        });
    }

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

        const base = AggregateStateHelper.fingerprintState(new TodoStateFactory().create());
        const drifted = AggregateStateHelper.fingerprintState(new DriftedTodoStateFactory().create());
        assert.notStrictEqual(drifted, base, "a changed create() default must produce a different fingerprint");
    });

    await test("fingerprint is stable across repeated calls", () =>
    {
        const a = AggregateStateHelper.fingerprintState(new TodoStateFactory().create());
        const b = AggregateStateHelper.fingerprintState(new TodoStateFactory().create());
        assert.strictEqual(a, b);
    });
});
