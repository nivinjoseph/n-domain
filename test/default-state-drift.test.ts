import "@nivinjoseph/n-ext";
import assert from "node:assert";
import { describe, test } from "node:test";
import { DomainContext } from "../src/index.js";
import { Todo } from "./domain/todo.js";
import { TodoState, TodoStateFactory } from "./domain/todo-state.js";


await describe("Untouched-field default drift on replay", async () =>
{
    const domainContext: DomainContext = { userId: "dev" };

    await test(`
        Given a Todo created and never marked completed,
            and a later code version whose create() flips the untouched-field default isCompleted to true,
        When the stream is replayed under the changed factory,
        Then isCompleted is the historical false (from the frozen created event), not the new default
    `,
        () =>
        {
            const original = Todo.create(domainContext, "title", "description");
            assert.strictEqual(original.isCompleted, false);

            const serialized = original.serialize();

            // simulate a future code version whose create() changes an existing untouched-field default.
            // (the shape is unchanged, so no migration step is involved — this is pure value drift.)
            class DriftedTodoStateFactory extends TodoStateFactory
            {
                public override create(): TodoState
                {
                    const state = super.create();
                    state.isCompleted = true;
                    return state;
                }
            }

            const replayed = Todo.deserializeFromEvents(
                domainContext, Todo, new DriftedTodoStateFactory(), serialized.$events);

            // without option 2 this would be true (today's create() default);
            // with it, the frozen historical default wins
            assert.strictEqual(replayed.isCompleted, false);
        });

    await test(`
        Given a Todo created before a new field existed,
            and a later code version whose create() adds a brand-new field with a default,
        When the stream is replayed under the changed factory,
        Then the new field falls through to the current create() default (additive evolution preserved),
            and the untouched existing field is unaffected
    `,
        () =>
        {
            const original = Todo.create(domainContext, "title", "description");
            const serialized = original.serialize();

            // simulate a future code version whose create() adds a field absent from the frozen snapshot
            class ExtendedTodoStateFactory extends TodoStateFactory
            {
                public override create(): TodoState
                {
                    const state = super.create();
                    (state as TodoState & { priority: string; }).priority = "low";
                    return state;
                }
            }

            const replayed = Todo.deserializeFromEvents(
                domainContext, Todo, new ExtendedTodoStateFactory(), serialized.$events);

            const snapshot = replayed.snapshot() as { priority?: string; isCompleted: boolean; };
            assert.strictEqual(snapshot.priority, "low");   // new field uses the current create() default
            assert.strictEqual(snapshot.isCompleted, false); // untouched existing field unchanged
        });

    await test(`
        Given a Todo with updates and a rebase in its stream,
        When it is serialized and replayed,
        Then the frozen created event composes with rebase without regressing state,
            and the full round-trip self-check passes
    `,
        () =>
        {
            const original = Todo.create(domainContext, "title", "description");
            original.updateTitle("title update 1");
            original.updateTitle("title update 2");

            let serialized = original.serialize();
            const deserialized = Todo.deserializeFromEvents(
                domainContext, Todo, new TodoStateFactory(), serialized.$events);

            deserialized.rebase(2);
            const rebasedSnapshot = JSON.stringify(deserialized.snapshot());

            serialized = deserialized.serialize();
            const replayed = Todo.deserializeFromEvents(
                domainContext, Todo, new TodoStateFactory(), serialized.$events);

            assert.strictEqual(JSON.stringify(replayed.snapshot()), rebasedSnapshot);
            assert.strictEqual(replayed.title, "title update 1");
            assert.strictEqual(replayed.isRebased, true);

            replayed.test();
        });

    await test(`
        Given a created Todo followed by a non-created event,
        When the aggregate is serialized,
        Then only the created event carries $frozenDefaultState (no per-event bloat),
            and the frozen payload holds the untouched domain default with base fields stripped
    `,
        () =>
        {
            const todo = Todo.create(domainContext, "title", "description");
            todo.updateTitle("new title");

            const events = todo.serialize().$events;
            const created = events.find(e => e.$isCreatedEvent === true);
            const nonCreated = events.find(e => e.$isCreatedEvent !== true);

            assert.ok(created != null, "expected a created event");
            assert.ok(nonCreated != null, "expected a non-created event");

            assert.ok("$frozenDefaultState" in created, "created event must carry $frozenDefaultState");
            assert.ok(!("$frozenDefaultState" in nonCreated),
                "non-created events must not carry $frozenDefaultState (no per-event bloat)");

            const frozen = (created as { $frozenDefaultState: Record<string, unknown>; }).$frozenDefaultState;
            assert.strictEqual(frozen["isCompleted"], false);     // untouched domain default is captured
            assert.strictEqual(frozen["$schemaVersion"], 1,
                "frozen default must carry its write-time $schemaVersion stamp");
            assert.ok(!("typeVersion" in frozen), "legacy typeVersion must never appear in frozen default");
            assert.ok(!("id" in frozen), "id (base field) must be stripped from frozen default");
            assert.ok(!("version" in frozen), "version (base field) must be stripped from frozen default");
        });
});
