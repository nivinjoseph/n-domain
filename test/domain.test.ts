import "@nivinjoseph/n-ext";
import { Delay, Schema, serialize } from "@nivinjoseph/n-util";
import assert from "node:assert";
import { describe, test } from "node:test";
import { AggregateRoot, DomainContext, DomainHelper, StateMigration } from "../src/index.js";
import { TodoCreated } from "./domain/events/todo-created.js";
import { TodoDescriptionUpdated } from "./domain/events/todo-description-updated.js";
import { TodoRebased } from "./domain/events/todo-rebased.js";
import { Todo } from "./domain/todo.js";
import { TodoDescription } from "./domain/value-objects/todo-description.js";
import { LegacyTodoRebased } from "./domain/events/legacy-todo-rebased.js";
import { MigratedTodoStateFactory, TodoState, TodoStateFactory } from "./domain/todo-state.js";


await describe("Domain tests", async () =>
{
    const domainContext: DomainContext = { userId: "dev" };

    //await test("AggregateRoot", () =>
    // {
    //     const domainContext = new DevDomainContext();

    //     const original = Todo.create(domainContext, "First", "This is the first.");
    //     original.updateTitle("First 1");
    //     original.updateTitle("First 2");


    //     assert.ok(original instanceof Todo);
    //     assert.strictEqual((<Object>original).getTypeName(), "Todo");

    //     assert.ok(original.id != null && !original.id.isEmptyOrWhiteSpace());

    //     assert.strictEqual(original.retroEvents.length, 1);
    //     assert.strictEqual(original.retroVersion, 1);

    //     assert.strictEqual(original.currentEvents.length, 2);
    //     assert.strictEqual(original.currentVersion, 3);

    //     assert.strictEqual(original.events.length, 3);
    //     assert.strictEqual(original.version, 3);

    //     assert.ok(original.createdAt > 0);
    //     assert.ok(original.updatedAt > 0);

    //     assert.strictEqual(original.hasChanges, true);

    //     assert.strictEqual(original.title, "First 2");
    //     assert.strictEqual(original.description, "This is the first.");


    //     const serialized = original.serialize();
    //     const deserialized = Todo.deserialize(domainContext, serialized);

    //     assert.ok(deserialized instanceof Todo);
    //     assert.strictEqual((<Object>deserialized).getTypeName(), "Todo");

    //     assert.strictEqual(deserialized.id, original.id);

    //     assert.strictEqual(deserialized.retroEvents.length, 3);
    //     assert.strictEqual(deserialized.retroVersion, 3);

    //     assert.strictEqual(deserialized.currentEvents.length, 0);
    //     assert.strictEqual(deserialized.currentVersion, 3);

    //     assert.strictEqual(deserialized.events.length, 3);
    //     assert.strictEqual(deserialized.version, 3);

    //     assert.strictEqual(deserialized.createdAt, original.createdAt);
    //     assert.strictEqual(deserialized.updatedAt, original.updatedAt);

    //     assert.strictEqual(deserialized.hasChanges, false);

    //     assert.strictEqual(deserialized.title, original.title);
    //     assert.strictEqual(deserialized.description, original.description);


    //     const reconstructed = deserialized.constructVersion(1);

    //     assert.ok(reconstructed instanceof Todo);
    //     assert.strictEqual((<Object>reconstructed).getTypeName(), "Todo");

    //     assert.strictEqual(reconstructed.id, original.id);

    //     assert.strictEqual(reconstructed.retroEvents.length, 1);
    //     assert.strictEqual(reconstructed.retroVersion, 1);

    //     assert.strictEqual(reconstructed.currentEvents.length, 0);
    //     assert.strictEqual(reconstructed.currentVersion, 1);

    //     assert.strictEqual(reconstructed.events.length, 1);
    //     assert.strictEqual(reconstructed.version, 1);

    //     assert.strictEqual(reconstructed.createdAt, original.createdAt);
    //     assert.strictEqual(reconstructed.updatedAt, original.createdAt);

    //     assert.strictEqual(reconstructed.hasChanges, false);

    //     assert.strictEqual(reconstructed.title, "First");
    //     assert.strictEqual(reconstructed.description, original.description);
    // });

    //await test("Trimming", () =>
    // {
    //     const domainContext = new DevDomainContext();

    //     const original = Todo.create(domainContext, "First", "This is the first.");
    //     original.updateTitle("First 1");

    //     let serialized = original.serialize();
    //     console.log(serialized);
    //     let deserialized = Todo.deserialize(domainContext, serialized);

    //     deserialized.updateTitle("First 2");

    //     serialized = deserialized.serialize();
    //     console.log(serialized);

    //     deserialized = Todo.deserialize(domainContext, serialized);
    //     console.log(deserialized.serialize());
    // });


    await describe("Standard stuff", async () =>
    {
        await test(`
            Given an aggregate class of type Todo,
            When a new instance is created,
            Then its id should have value,
                and its retroEvents count should be 1
                and its retroVersion should be 1,
                and its currentEvents count should be 0,
                and its currentVersion should be 1,
                and its events count should be 1,
                and its version should be 1,
                and its createdAt should be > 0,
                and its updatedAt should be > 0,
                and its createdAt should be = to its updatedAt,
                and its isNew should be true,
                and its hasChanges should be false,
                and its properties should have creation values
        `,
            () =>
            {
                const original = Todo.create(domainContext, "title", "description");

                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                assert.ok(original.id != null && !original.id.isEmptyOrWhiteSpace());
                assert.strictEqual(original.retroEvents.length, 1);
                assert.strictEqual(original.retroVersion, 1);
                assert.strictEqual(original.currentEvents.length, 0);
                assert.strictEqual(original.currentVersion, 1);
                assert.strictEqual(original.events.length, 1);
                assert.strictEqual(original.version, 1);
                assert.ok(original.createdAt > 0);
                assert.ok(original.updatedAt > 0);
                assert.strictEqual(original.createdAt, original.updatedAt);
                assert.strictEqual(original.isNew, true);
                assert.strictEqual(original.hasChanges, false);
                assert.strictEqual(original.title, "title");
                assert.strictEqual(original.description, "description");
            });

        await test(`
            Given an aggregate instance of Type Todo,
            When the instance is updated once,
            Then its id should have value,
                and its retroEvents count should be 1
                and its retroVersion should be 1,
                and its currentEvents count should be 1,
                and its currentVersion should be 2,
                and its events count should be 2,
                and its version should be 2,
                and its createdAt should be > 0,
                and its updatedAt should be > 0,
                and its createdAt should be <= its updatedAt,
                and its isNew should be true,
                and its hasChanges should be true,
                and its updated property should reflect the last update,
                and its non updated property should have its creation value
        `,
            () =>
            {
                const original = Todo.create(domainContext, "title", "description");

                original.updateTitle("title update 1");

                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                assert.ok(original.id != null && !original.id.isEmptyOrWhiteSpace());
                assert.strictEqual(original.retroEvents.length, 1);
                assert.strictEqual(original.retroVersion, 1);
                assert.strictEqual(original.currentEvents.length, 1);
                assert.strictEqual(original.currentVersion, 2);
                assert.strictEqual(original.events.length, 2);
                assert.strictEqual(original.version, 2);
                assert.ok(original.createdAt > 0);
                assert.ok(original.updatedAt > 0);
                assert.ok(original.createdAt <= original.updatedAt);
                assert.strictEqual(original.isNew, true);
                assert.strictEqual(original.hasChanges, true);
                assert.strictEqual(original.title, "title update 1");
                assert.strictEqual(original.description, "description");
            });

        await test(`
            Given an aggregate instance of Type Todo,
            When the instance is updated twice,
            Then its id should have value,
                and its retroEvents count should be 1
                and its retroVersion should be 1,
                and its currentEvents count should be 2,
                and its currentVersion should be 3,
                and its events count should be 3,
                and its version should be 3,
                and its createdAt should be > 0,
                and its updatedAt should be > 0,
                and its createdAt should be < its updatedAt,
                and its isNew should be true,
                and its hasChanges should be true,
                and its updated property should reflect the last update,
                and its non updated property should have its creation value
        `,
            () =>
            {
                const original = Todo.create(domainContext, "title", "description");

                original.updateTitle("title update 1");
                original.updateTitle("title update 2");

                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                assert.ok(original.id != null && !original.id.isEmptyOrWhiteSpace());
                assert.strictEqual(original.retroEvents.length, 1);
                assert.strictEqual(original.retroVersion, 1);
                assert.strictEqual(original.currentEvents.length, 2);
                assert.strictEqual(original.currentVersion, 3);
                assert.strictEqual(original.events.length, 3);
                assert.strictEqual(original.version, 3);
                assert.ok(original.createdAt > 0);
                assert.ok(original.updatedAt > 0);
                assert.ok(original.createdAt <= original.updatedAt);
                assert.strictEqual(original.isNew, true);
                assert.strictEqual(original.hasChanges, true);
                assert.strictEqual(original.title, "title update 2");
                assert.strictEqual(original.description, "description");
            });

        await test(`
            Given an aggregate instance of Type Todo,
                and it has been updated twice,
            When the instance serialized and deserialized
            Then the deserialized instance id should be equal to the original id,
                and its retroEvents count should be 3
                and its retroVersion should be 3,
                and its currentEvents count should be 0,
                and its currentVersion should be 3,
                and its events count should be 3,
                and its version should be 3,
                and its createdAt should be equal to original createdAt,
                and its updatedAt should be equal to original updatedAt,
                and its isNew should be false,
                and its hasChanges should be false,
                and its updated property should reflect the last update
        `,
            () =>
            {
                const original = Todo.create(domainContext, "title", "description");
                original.updateTitle("title update 1");
                original.updateTitle("title update 2");

                const serialized = original.serialize();
                const deserialized = Todo.deserializeFromEvents(domainContext, Todo, new TodoStateFactory(), serialized.$events);

                assert.strictEqual(deserialized.id, original.id);
                assert.strictEqual(deserialized.retroEvents.length, 3);
                assert.strictEqual(deserialized.retroVersion, 3);
                assert.strictEqual(deserialized.currentEvents.length, 0);
                assert.strictEqual(deserialized.currentVersion, 3);
                assert.strictEqual(deserialized.events.length, 3);
                assert.strictEqual(deserialized.version, 3);
                assert.strictEqual(deserialized.createdAt, original.createdAt);
                assert.strictEqual(deserialized.updatedAt, original.updatedAt);
                assert.strictEqual(deserialized.isNew, false);
                assert.strictEqual(deserialized.hasChanges, false);
                assert.strictEqual(deserialized.title, "title update 2");
                assert.strictEqual(deserialized.description, "description");
            });

        await test(`
            Given an aggregate instance of Type Todo,
                and it has been updated twice,
                and serialized and deserialized
            When the deserialized instance is updated once again
            Then the deserialized instance id should be equal to the original id,
                and its retroEvents count should be 3
                and its retroVersion should be 3,
                and its currentEvents count should be 1,
                and its currentVersion should be 4,
                and its events count should be 4,
                and its version should be 4,
                and its createdAt should be equal to original createdAt,
                and its isNew should be false,
                and its hasChanges should be true,
                and its updated property should reflect the last update
        `,
            () =>
            {
                const original = Todo.create(domainContext, "title", "description");
                original.updateTitle("title update 1");
                original.updateTitle("title update 2");
                const serialized = original.serialize();
                const deserialized = Todo.deserializeFromEvents(domainContext, Todo, new TodoStateFactory(), serialized.$events);

                // console.log("Type version", (<any>deserialized).state.typeVersion);

                deserialized.updateTitle("title update 3");

                assert.strictEqual(deserialized.id, original.id);
                assert.strictEqual(deserialized.retroEvents.length, 3);
                assert.strictEqual(deserialized.retroVersion, 3);
                assert.strictEqual(deserialized.currentEvents.length, 1);
                assert.strictEqual(deserialized.currentVersion, 4);
                assert.strictEqual(deserialized.events.length, 4);
                assert.strictEqual(deserialized.version, 4);
                assert.strictEqual(deserialized.createdAt, original.createdAt);
                // assert.ok(deserialized.updatedAt, original.updatedAt);
                assert.strictEqual(deserialized.isNew, false);
                assert.strictEqual(deserialized.hasChanges, true);
                assert.strictEqual(deserialized.title, "title update 3");
                assert.strictEqual(deserialized.description, "description");
            });
    });


    await describe("Schema migration", async () =>
    {
        // MigratedTodoStateFactory simulates current code at schema version 2, where version 1's
        // `legacyTitle` was renamed to `title`. Old-shape artifacts are crafted by hand.
        const reshapeToV1 = (payload: Record<string, any>): Record<string, any> =>
        {
            payload["legacyTitle"] = payload["title"];
            delete payload["title"];
            return payload;
        };

        await test(`
            Given a snapshot written at schema version 1 (stamped $schemaVersion 1, old shape),
            When it is deserialized through a factory at schema version 2 whose migration chain
                renames the field forward,
            Then deserialization should succeed and the renamed field's value should be recovered
        `,
            () =>
            {
                const original = Todo.create(domainContext, "title", null);
                const snapshot = original.snapshot() as Record<string, any>;
                assert.strictEqual(snapshot["$schemaVersion"], 1);
                reshapeToV1(snapshot);

                const migrated = AggregateRoot.deserializeFromSnapshot(
                    domainContext, Todo, new MigratedTodoStateFactory(), snapshot as unknown as TodoState);

                assert.strictEqual(migrated.id, original.id);
                assert.strictEqual(migrated.title, "title");
            });

        await test(`
            Given a legacy snapshot carrying the pre-4.0 in-band typeVersion stamp (no $schemaVersion),
            When it is deserialized through a factory at schema version 2,
            Then the in-band stamp should drive the migration chain,
                and typeVersion should never reach live state
        `,
            () =>
            {
                const original = Todo.create(domainContext, "title", null);
                const snapshot = original.snapshot() as Record<string, any>;
                delete snapshot["$schemaVersion"];
                reshapeToV1(snapshot);
                snapshot["typeVersion"] = 1;

                const migrated = AggregateRoot.deserializeFromSnapshot(
                    domainContext, Todo, new MigratedTodoStateFactory(), snapshot as unknown as TodoState);

                assert.strictEqual(migrated.title, "title");
                assert.ok(!("typeVersion" in (migrated as unknown as { state: object; }).state));
            });

        await test(`
            Given a snapshot containing keys that do not exist on the current state shape,
            When it is deserialized through a factory with no migration step for them,
            Then deserialization should throw loudly (zombie/rename ingress guard)
        `,
            () =>
            {
                const original = Todo.create(domainContext, "title", null);
                const snapshot = reshapeToV1(original.snapshot() as Record<string, any>);

                assert.throws(
                    () => AggregateRoot.deserializeFromSnapshot(
                        domainContext, Todo, new TodoStateFactory(), snapshot as unknown as TodoState),
                    /legacyTitle/);
            });

        await test(`
            Given a snapshot stamped with a schema version newer than the current code's,
            When it is deserialized,
            Then deserialization should throw (artifact written by newer code)
        `,
            () =>
            {
                const original = Todo.create(domainContext, "title", null);
                const snapshot = original.snapshot() as Record<string, any>;
                snapshot["$schemaVersion"] = 5;

                assert.throws(
                    () => AggregateRoot.deserializeFromSnapshot(
                        domainContext, Todo, new TodoStateFactory(), snapshot as unknown as TodoState),
                    /newer code/);
            });

        await test(`
            Given a legacy snapshot whose in-band typeVersion exceeds the migration chain,
            When it is deserialized,
            Then deserialization should throw the dedicated under-ported-chain error
                (not the misleading "newer code" one)
        `,
            () =>
            {
                const original = Todo.create(domainContext, "title", null);
                const snapshot = original.snapshot() as Record<string, any>;
                delete snapshot["$schemaVersion"];
                snapshot["typeVersion"] = 3;

                assert.throws(
                    () => AggregateRoot.deserializeFromSnapshot(
                        domainContext, Todo, new TodoStateFactory(), snapshot as unknown as TodoState),
                    /port the pre-4\.0 update\(\) chain/);
            });

        await test(`
            Given a snapshot missing a field that exists on the current state shape,
            When it is deserialized,
            Then the missing field should fall through to the current create() default
                (additive evolution stays free)
        `,
            () =>
            {
                const original = Todo.create(domainContext, "title", null);
                const snapshot = original.snapshot() as Record<string, any>;
                delete snapshot["isCompleted"];

                const loaded = AggregateRoot.deserializeFromSnapshot(
                    domainContext, Todo, new TodoStateFactory(), snapshot as unknown as TodoState);

                assert.strictEqual(loaded.isCompleted, false);
            });

        await test(`
            Given a stream whose created event carries an old-shape frozen default state,
            When it is replayed through a factory at schema version 2,
            Then the frozen default should be upcast at ingress and replay should succeed,
                and replaying through a factory WITHOUT the migration step should throw
        `,
            () =>
            {
                const original = Todo.create(domainContext, "title", null);
                original.updateTitle("updated");
                const serialized = original.serialize();

                const created = serialized.$events.find(e => e.$isCreatedEvent === true) as Record<string, any>;
                created["$frozenDefaultState"] = {
                    legacyTitle: null,
                    description: null,
                    isCompleted: false,
                    $schemaVersion: 1
                };

                const replayed = Todo.deserializeFromEvents(
                    domainContext, Todo, new MigratedTodoStateFactory(), serialized.$events);
                assert.strictEqual(replayed.title, "updated");
                assert.strictEqual(replayed.isCompleted, false);

                assert.throws(
                    () => Todo.deserializeFromEvents(domainContext, Todo, new TodoStateFactory(), serialized.$events),
                    /legacyTitle/);
            });

        await test(`
            Given a rebased stream whose rebase baseline was written at schema version 1 (old shape),
            When it is replayed through a factory at schema version 2,
            Then the baseline should be upcast at ingress and the renamed field's value recovered
                (a value stranded in an old-shape key is rescued, not lost),
                and the full round-trip self-check should pass
        `,
            () =>
            {
                const original = Todo.create(domainContext, "title", "description");
                original.updateTitle("title update 1");
                original.updateTitle("title update 2");
                original.rebase(2);
                const serialized = original.serialize();

                const rebaseEventData = serialized.$events
                    .find(e => (e as Record<string, any>)["$baseline"] != null) as Record<string, any> | undefined;
                assert.ok(rebaseEventData != null, "expected a rebase event in the stream");
                reshapeToV1(rebaseEventData["$baseline"] as Record<string, any>);

                const replayed = Todo.deserializeFromEvents(
                    domainContext, Todo, new MigratedTodoStateFactory(), serialized.$events);

                assert.strictEqual(replayed.title, "title update 1");
                assert.strictEqual(replayed.isRebased, true);
                assert.strictEqual(replayed.rebasedFromVersion, 2);
                replayed.test();

                assert.throws(
                    () => Todo.deserializeFromEvents(domainContext, Todo, new TodoStateFactory(), serialized.$events),
                    /legacyTitle/);
            });

        await test(`
            Given a live state carrying a key that does not exist on the current state shape,
            When snapshot() is invoked,
            Then it should throw (egress guard severing the residue-laundering loop),
                and a subsequent rebase should RESET the state so snapshot() succeeds again
        `,
            () =>
            {
                const todo = Todo.create(domainContext, "title", "description");
                todo.updateTitle("title update 1");

                (todo as unknown as { _state: Record<string, any>; })._state["zombie"] = "residue";
                assert.throws(() => todo.snapshot(), /zombie/);

                todo.rebase(2);
                const snapshot = todo.snapshot() as Record<string, any>;
                assert.ok(!("zombie" in snapshot), "RESET rebase must clear residue");
                assert.strictEqual(todo.title, "title update 1");
            });

        await test(`
            Given a stream persisted with a pre-4.0 user-defined rebase event (defaultState + rebaseState pair),
            When it is replayed under current code,
            Then the deprecated legacy apply path should preserve historical behavior unchanged
        `,
            () =>
            {
                const original = Todo.create(domainContext, "title", "description");
                original.updateTitle("title update 1");
                original.updateTitle("title update 2");
                const serialized = original.serialize();

                const v2Snapshot = original.constructVersion(2).snapshot() as Record<string, any>;
                delete v2Snapshot["$schemaVersion"];
                ["id", "version", "createdAt", "updatedAt", "isRebased", "rebasedFromVersion"]
                    .forEach(key => { delete v2Snapshot[key]; });

                const legacyRebase = new LegacyTodoRebased({
                    $aggregateId: original.id,
                    $id: `${original.id}-4`,
                    $userId: "dev",
                    $occurredAt: original.updatedAt,
                    $version: 4,
                    defaultState: { title: null, description: null, isCompleted: false },
                    rebaseState: v2Snapshot,
                    rebaseVersion: 2
                });

                const events = [...serialized.$events, legacyRebase.serialize()];
                const replayed = Todo.deserializeFromEvents(domainContext, Todo, new TodoStateFactory(), events);

                assert.strictEqual(replayed.title, "title update 1");
                assert.strictEqual(replayed.isRebased, true);
                assert.strictEqual(replayed.rebasedFromVersion, 2);
                assert.strictEqual(replayed.version, 4);
            });

        await test(`
            Given a newly created aggregate,
            When it is serialized,
            Then every event should carry the write-time $schemaVersion stamp,
                and the snapshot should carry it as envelope metadata
        `,
            () =>
            {
                const todo = Todo.create(domainContext, "title", "description");
                todo.updateTitle("updated");

                const serialized = todo.serialize();
                serialized.$events.forEach(e =>
                    assert.strictEqual((e as Record<string, any>)["$schemaVersion"], 1));

                const snapshot = todo.snapshot() as Record<string, any>;
                assert.strictEqual(snapshot["$schemaVersion"], 1);
            });

        await test(`
            Given a rebased stream with an old-shape baseline AND events applied after the rebase,
            When it is replayed through a migrated factory,
            Then RESET-then-apply ordering must hold: post-rebase events win over the upcast baseline,
                and the full round-trip self-check passes,
                and a second rebase over the migrated replay is stable
        `,
            () =>
            {
                const original = Todo.create(domainContext, "title", "description");
                original.updateTitle("title update 1");
                original.rebase(2);
                original.updateTitle("post-rebase title");
                const serialized = original.serialize();

                const rebaseEventData = serialized.$events
                    .find(e => (e as Record<string, any>)["$baseline"] != null) as Record<string, any> | undefined;
                assert.ok(rebaseEventData != null, "expected a rebase event in the stream");
                reshapeToV1(rebaseEventData["$baseline"] as Record<string, any>);

                const replayed = Todo.deserializeFromEvents(
                    domainContext, Todo, new MigratedTodoStateFactory(), serialized.$events);

                assert.strictEqual(replayed.title, "post-rebase title");
                assert.strictEqual(replayed.isCompleted, false);
                replayed.test();

                replayed.rebase(2);
                assert.strictEqual(replayed.title, "title update 1");
                assert.strictEqual(replayed.rebasedFromVersion, 2);

                const reserialized = replayed.serialize();
                const replayedAgain = Todo.deserializeFromEvents(
                    domainContext, Todo, new MigratedTodoStateFactory(), reserialized.$events);
                assert.strictEqual(replayedAgain.title, "title update 1");
                replayedAgain.test();
            });

        await test(`
            Given a migration step that mutates a NESTED object of the payload in place,
            When a rebased stream is replayed through it (twice),
            Then the stored rebase event's baseline artifact must remain untouched (deep-clone seam),
                and re-replay must not double-apply the step
        `,
            () =>
            {
                class NestedMutatingTodoStateFactory extends TodoStateFactory
                {
                    protected override defineMigrations(): ReadonlyArray<StateMigration>
                    {
                        return [
                            {
                                migrate: (payload: Record<string, any>): Record<string, any> =>
                                {
                                    const description = payload["description"] as Record<string, any> | null;
                                    if (description != null)
                                        description["description"] = `${description["description"]}!`;
                                    return payload;
                                }
                            }
                        ];
                    }
                }

                const original = Todo.create(domainContext, "title", "description");
                original.updateTitle("title update 1");
                original.rebase(2);
                const serialized = original.serialize();

                const rebaseEventData = serialized.$events
                    .find(e => (e as Record<string, any>)["$baseline"] != null) as Record<string, any> | undefined;
                assert.ok(rebaseEventData != null, "expected a rebase event in the stream");

                const replayed1 = Todo.deserializeFromEvents(
                    domainContext, Todo, new NestedMutatingTodoStateFactory(), serialized.$events);
                assert.strictEqual(replayed1.description, "description!");

                const baseline = rebaseEventData["$baseline"] as Record<string, any>;
                assert.strictEqual((baseline["description"] as Record<string, any>)["description"], "description",
                    "the stored artifact must not be mutated by the migration step");

                const replayed2 = Todo.deserializeFromEvents(
                    domainContext, Todo, new NestedMutatingTodoStateFactory(), serialized.$events);
                assert.strictEqual(replayed2.description, "description!",
                    "re-replay must not double-apply the migration step");
            });

        await test(`
            Given a pre-4.0 stream (no $schemaVersion on any event, no $frozenDefaultState),
            When it is replayed and re-serialized,
            Then the output must be byte-identical (legacy events are never retro-stamped)
        `,
            () =>
            {
                const original = Todo.create(domainContext, "title", "description");
                original.updateTitle("updated");
                const serialized = original.serialize();

                const legacyEvents = serialized.$events.map(e =>
                {
                    const copy = { ...e } as Record<string, any>;
                    delete copy["$schemaVersion"];
                    delete copy["$frozenDefaultState"];
                    return copy;
                });
                const legacyBytes = legacyEvents.map(e => JSON.stringify(e));

                const replayed = Todo.deserializeFromEvents(
                    domainContext, Todo, new TodoStateFactory(), legacyEvents);
                const reserializedBytes = replayed.serialize().$events.map(e => JSON.stringify(e));

                assert.deepStrictEqual(reserializedBytes, legacyBytes);
                assert.ok(reserializedBytes.every(t => !t.contains("$schemaVersion")),
                    "legacy events must never gain a $schemaVersion stamp");
            });

        await test(`
            Given a pre-4.0 rebase event whose payload is in an OLD shape,
            When the stream is replayed through a factory with a migration chain,
            Then replay must fail loudly at load (end-of-replay conformance guard),
                instead of silently reading stale values
        `,
            () =>
            {
                const original = Todo.create(domainContext, "title", "description");
                original.updateTitle("title update 1");
                original.updateTitle("title update 2");
                const serialized = original.serialize();

                const legacyRebase = new LegacyTodoRebased({
                    $aggregateId: original.id,
                    $id: `${original.id}-4`,
                    $userId: "dev",
                    $occurredAt: original.updatedAt,
                    $version: 4,
                    defaultState: { legacyTitle: null, description: null, isCompleted: false },
                    rebaseState: { legacyTitle: "title update 1", description: null, isCompleted: false },
                    rebaseVersion: 2
                });

                const events = [...serialized.$events, legacyRebase.serialize()];

                assert.throws(
                    () => Todo.deserializeFromEvents(domainContext, Todo, new MigratedTodoStateFactory(), events),
                    /legacyTitle/);
            });

        await test(`
            Given a RebaseEvent subclass that overrides applyEvent,
            When it is constructed,
            Then construction must throw (the no-op contract is constructor-enforced)
        `,
            () =>
            {
                @serialize("Test")
                class BadTodoRebased extends TodoRebased
                {
                    protected override applyEvent(_state: TodoState): void
                    {
                        // deliberate violation of the RebaseEvent contract
                    }
                }

                assert.throws(
                    () => new BadTodoRebased({ $baseline: { title: null }, $rebaseVersion: 1 }),
                    /must not override applyEvent/);
            });

        await test(`
            Given a mix of stored (deserialized) events and unapplied (new) events,
            When an aggregate is constructed from them,
            Then construction must throw (mixed streams would retro-stamp legacy events)
        `,
            () =>
            {
                const original = Todo.create(domainContext, "title", "description");
                original.updateTitle("updated");
                const serialized = original.serialize();

                const events = serialized.$events.map((e, index) =>
                {
                    if (index === 0)
                        return e;
                    const copy = { ...e } as Record<string, any>;
                    copy["$aggregateId"] = null;
                    copy["$id"] = null;
                    copy["$version"] = null;
                    return copy;
                });

                assert.throws(
                    () => Todo.deserializeFromEvents(domainContext, Todo, new TodoStateFactory(), events),
                    /mixed streams/);
            });
    });


    await describe("Reconstruction", async () =>
    {
        await test(`
            Given an aggregate instance of Type Todo,
                and it has been updated twice,
            When the instance is reconstructed to version 2
            Then reconstructed instance should have same id as original,
                and its retroEvents count should be 2
                and its retroVersion should be 2,
                and its currentEvents count should be 0,
                and its currentVersion should be 2,
                and its events count should be 2,
                and its version should be 2,
                and its createdAt should be same as original createdAt,
                and its updatedAt should be > 0,
                and its createdAt should be <= its updatedAt,
                and its isNew should be false, // reconstructed aggregates will always have isNew === false
                and its hasChanges should be false,
                and its isReconstructed should be true,
                and its reconstructedFromVersion should be 3,
                and its updated property should reflect the version 2 value
        `,
            () =>
            {
                const original = Todo.create(domainContext, "title", "description");
                original.updateTitle("title update 1");
                original.updateTitle("title update 2");

                const reconstructed = original.constructVersion(2);

                assert.strictEqual(reconstructed.id, original.id);
                assert.strictEqual(reconstructed.retroEvents.length, 2);
                assert.strictEqual(reconstructed.retroVersion, 2);
                assert.strictEqual(reconstructed.currentEvents.length, 0);
                assert.strictEqual(reconstructed.currentVersion, 2);
                assert.strictEqual(reconstructed.events.length, 2);
                assert.strictEqual(reconstructed.version, 2);
                assert.strictEqual(reconstructed.createdAt, original.createdAt);
                assert.ok(reconstructed.updatedAt > 0);
                assert.ok(reconstructed.createdAt <= reconstructed.updatedAt);
                assert.strictEqual(reconstructed.isNew, false);
                assert.strictEqual(reconstructed.hasChanges, false);
                assert.strictEqual(reconstructed.isReconstructed, true);
                assert.strictEqual(reconstructed.reconstructedFromVersion, 3);
                assert.strictEqual(reconstructed.title, "title update 1");
                assert.strictEqual(reconstructed.description, "description");
            });

        await test(`
            Given an aggregate instance of Type Todo,
                and it has been updated twice,
                and serialized and deserialized
            When the instance is reconstructed to version 2
            Then reconstructed instance should have same id as original,
                and its retroEvents count should be 2
                and its retroVersion should be 2,
                and its currentEvents count should be 0,
                and its currentVersion should be 2,
                and its events count should be 2,
                and its version should be 2,
                and its createdAt should be same as original createdAt,
                and its updatedAt should be > 0,
                and its createdAt should be <= its updatedAt,
                and its isNew should be false,
                and its hasChanges should be false,
                and its isReconstructed should be true,
                and its reconstructedFromVersion should be 3,
                and its updated property should reflect the version 2 value
        `,
            () =>
            {
                const original = Todo.create(domainContext, "title", "description");
                original.updateTitle("title update 1");
                original.updateTitle("title update 2");
                const serialized = original.serialize();
                const deserialized = Todo.deserializeFromEvents(domainContext, Todo, new TodoStateFactory(), serialized.$events);

                const reconstructed = deserialized.constructVersion(2);

                assert.strictEqual(reconstructed.id, original.id);
                assert.strictEqual(reconstructed.retroEvents.length, 2);
                assert.strictEqual(reconstructed.retroVersion, 2);
                assert.strictEqual(reconstructed.currentEvents.length, 0);
                assert.strictEqual(reconstructed.currentVersion, 2);
                assert.strictEqual(reconstructed.events.length, 2);
                assert.strictEqual(reconstructed.version, 2);
                assert.strictEqual(reconstructed.createdAt, original.createdAt);
                assert.ok(reconstructed.updatedAt > 0);
                assert.ok(reconstructed.createdAt <= reconstructed.updatedAt);
                assert.strictEqual(reconstructed.isNew, false);
                assert.strictEqual(reconstructed.hasChanges, false);
                assert.strictEqual(reconstructed.isReconstructed, true);
                assert.strictEqual(reconstructed.reconstructedFromVersion, 3);
                assert.strictEqual(reconstructed.title, "title update 1");
                assert.strictEqual(reconstructed.description, "description");
            });
    });

    await describe("Cloning", async () =>
    {
        await test(`
            Given an aggregate,
            When it is cloned,
            Then the clone should be identical to the original except in identity and meta information
        `, async () =>
        {
            const original = Todo.create(domainContext, "title", "description");
            original.updateDescription("original description");
            original.markAsCompleted();
            // original = Todo.deserializeEvents(domainContext, original.serialize().$events);

            await Delay.seconds(1);

            const clone = original.clone(new TodoCreated({
                todoId: DomainHelper.generateId("tdo"),
                title: "different title",
                description: TodoDescription.create("different description")
            }));


            assert.notStrictEqual(clone.id, original.id, "id");
            assert.strictEqual(clone.version, original.version, "version");
            assert.notStrictEqual(clone.createdAt, original.createdAt, "createdAt");
            assert.notStrictEqual(clone.updatedAt, original.updatedAt, "updatedAt");

            assert.notStrictEqual(clone.title, original.title, "title");
            assert.strictEqual(clone.description, original.description, "description");
            assert.strictEqual(clone.isCompleted, original.isCompleted, "isCompleted");
        });

        await test(`
            Given an aggregate,
            When it is cloned and there is mutator involved,
            Then the clone should be identical to the original except in identity, meta information
                and mutated event data
        `, async () =>
        {
            const original = Todo.create(domainContext, "title", "description");
            original.updateDescription("original description");
            original.markAsCompleted();
            // original = Todo.deserializeEvents(domainContext, original.serialize().$events);

            await Delay.seconds(1);

            const clone = original.clone(new TodoCreated({
                todoId: DomainHelper.generateId("tdo"),
                title: "different title",
                description: TodoDescription.create("different description")
            }), (event) =>
            {
                if (event.$name === (<Object>TodoDescriptionUpdated).getTypeName())
                    ((event as unknown as Schema<TodoDescriptionUpdated, "description">)
                        .description! as Schema<TodoDescription, "description">).description = "mutated description";
                return true;
            });


            assert.notStrictEqual(clone.id, original.id, "id");
            assert.strictEqual(clone.version, original.version, "version");
            assert.notStrictEqual(clone.createdAt, original.createdAt, "createdAt");
            assert.notStrictEqual(clone.updatedAt, original.updatedAt, "updatedAt");

            assert.notStrictEqual(clone.title, original.title, "title");
            assert.strictEqual(clone.description, "mutated description", "description");
            assert.strictEqual(clone.isCompleted, original.isCompleted, "isCompleted");
        });
    });

    await describe("Rebasing", async () =>
    {
        await test(`
            Given an aggregate instance of Type Todo,
                and it has been updated twice,
            When the instance is rebased to version 2
            Then rebased instance should have same id as original,
                and its retroEvents count should be 1
                and its retroVersion should be 1,
                and its currentEvents count should be 3,
                and its currentVersion should be 4,
                and its events count should be 4,
                and its version should be 4,
                and its createdAt should be same as original createdAt,
                and its updatedAt should be >= original updatedAt,
                and its createdAt should be <= its updatedAt,
                and its isNew should be false, 
                and its hasChanges should be true,
                and its isRebased should be true,
                and its rebasedFromVersion should be 2
                and its updated property should reflect the version 2 value
        `,
            () =>
            {
                const original = Todo.create(domainContext, "title", "description");
                original.updateTitle("title update 1");
                original.updateTitle("title update 2");

                const rebased = original;
                rebased.rebase(2);

                assert.strictEqual(rebased.id, original.id);
                assert.strictEqual(rebased.retroEvents.length, 1);
                assert.strictEqual(rebased.retroVersion, 1);
                assert.strictEqual(rebased.currentEvents.length, 3);
                assert.strictEqual(rebased.currentVersion, 4);
                assert.strictEqual(rebased.events.length, 4);
                assert.strictEqual(rebased.version, 4);
                assert.strictEqual(rebased.createdAt, original.createdAt);
                assert.ok(rebased.updatedAt >= original.updatedAt);
                assert.ok(rebased.createdAt <= rebased.updatedAt);
                assert.strictEqual(rebased.isNew, true);
                assert.strictEqual(rebased.hasChanges, true);
                assert.strictEqual(rebased.isRebased, true);
                assert.strictEqual(rebased.rebasedFromVersion, 2);
                assert.strictEqual(rebased.title, "title update 1");
                assert.strictEqual(rebased.description, "description");
            });

        await test(`
            Given an aggregate instance of Type Todo,
                and it has been updated twice,
                and serialized and deserialized
            When the instance is rebased to version 2
            Then rebased instance should have same id as original,
                and its retroEvents count should be 3
                and its retroVersion should be 3,
                and its currentEvents count should be 1,
                and its currentVersion should be 4,
                and its events count should be 4,
                and its version should be 4,
                and its createdAt should be same as original createdAt,
                and its updatedAt should be >= original updatedAt,
                and its createdAt should be <= its updatedAt,
                and its isNew should be false,
                and its hasChanges should be true,
                and its isRebased should be true,
                and its rebasedFromVersion should be 2
                and its updated property should reflect the version 2 value
        `,
            () =>
            {
                const original = Todo.create(domainContext, "title", "description");
                original.updateTitle("title update 1");
                original.updateTitle("title update 2");
                const serialized = original.serialize();
                const deserialized = Todo.deserializeFromEvents(domainContext, Todo, new TodoStateFactory(), serialized.$events);

                const rebased = deserialized;
                rebased.rebase(2);

                assert.strictEqual(rebased.id, original.id);
                assert.strictEqual(rebased.retroEvents.length, 3);
                assert.strictEqual(rebased.retroVersion, 3);
                assert.strictEqual(rebased.currentEvents.length, 1);
                assert.strictEqual(rebased.currentVersion, 4);
                assert.strictEqual(rebased.events.length, 4);
                assert.strictEqual(rebased.version, 4);
                assert.strictEqual(rebased.createdAt, original.createdAt);
                assert.ok(rebased.updatedAt >= original.updatedAt);
                assert.ok(rebased.createdAt <= rebased.updatedAt);
                assert.strictEqual(rebased.isNew, false);
                assert.strictEqual(rebased.hasChanges, true);
                assert.strictEqual(rebased.isRebased, true);
                assert.strictEqual(rebased.rebasedFromVersion, 2);
                assert.strictEqual(rebased.title, "title update 1");
                assert.strictEqual(rebased.description, "description");
            });

        await test(`
            Given an aggregate instance of Type Todo,
                and it has been updated twice,
                and serialized and deserialized,
                and rebased to version 2,
                and updated
                and serialized and deserialized,
            When the instance is rebased again to version 2
            Then rebased instance should have same id as original,
                and its retroEvents count should be 5
                and its retroVersion should be 5,
                and its currentEvents count should be 1,
                and its currentVersion should be 6,
                and its events count should be 6,
                and its version should be 6,
                and its createdAt should be same as original createdAt,
                and its updatedAt should be >= original updatedAt,
                and its createdAt should be <= its updatedAt,
                and its isNew should be false,
                and its hasChanges should be true,
                and its isRebased should be true,
                and its rebasedFromVersion should be 2
                and its updated property should reflect the version 2 value
        `,
            () =>
            {
                const original = Todo.create(domainContext, "title", "description");

                const processSnapshot = (snapshot: object, details: string): object =>
                {
                    console.log(details, snapshot);

                    // @ts-expect-error: deliberate
                    delete snapshot.version;
                    // @ts-expect-error: deliberate
                    delete snapshot.isRebased;
                    // @ts-expect-error: deliberate
                    delete snapshot.rebasedFromVersion;
                    // @ts-expect-error: deliberate
                    delete snapshot.updatedAt;

                    return snapshot;
                };

                original.updateTitle("title update 1");
                const originalSnapshot = JSON.stringify(processSnapshot(original.snapshot(), "original"));
                original.updateTitle("title update 2");

                let serialized = original.serialize();
                let deserialized = Todo.deserializeFromEvents(domainContext, Todo, new TodoStateFactory(), serialized.$events);

                let rebased = deserialized;
                rebased.rebase(2);
                const rebase1Snapshot = JSON.stringify(processSnapshot(rebased.snapshot(), "rebase1"));

                rebased.updateTitle("title update 3");

                serialized = rebased.serialize();
                deserialized = Todo.deserializeFromEvents(domainContext, Todo, new TodoStateFactory(), serialized.$events);

                rebased = deserialized;
                rebased.rebase(2);
                const rebase2Snapshot = JSON.stringify(processSnapshot(rebased.snapshot(), "rebase2"));

                assert.strictEqual(rebased.id, original.id);
                assert.strictEqual(rebased.retroEvents.length, 5);
                assert.strictEqual(rebased.retroVersion, 5);
                assert.strictEqual(rebased.currentEvents.length, 1);
                assert.strictEqual(rebased.currentVersion, 6);
                assert.strictEqual(rebased.events.length, 6);
                assert.strictEqual(rebased.version, 6);
                assert.strictEqual(rebased.createdAt, original.createdAt);
                assert.ok(rebased.updatedAt >= original.updatedAt);
                assert.ok(rebased.createdAt <= rebased.updatedAt);
                assert.strictEqual(rebased.isNew, false);
                assert.strictEqual(rebased.hasChanges, true);
                assert.strictEqual(rebased.isRebased, true);
                assert.strictEqual(rebased.rebasedFromVersion, 2);
                assert.strictEqual(rebased.title, "title update 1");
                assert.strictEqual(rebased.description, "description");
                assert.strictEqual(originalSnapshot, rebase1Snapshot, "original vs rebase 1");
                assert.strictEqual(rebase1Snapshot, rebase2Snapshot, "rebase 1 vs rebase 2");
            });
    });

    await describe.skip("Trimming", async () =>
    {
        await test(`
            Given an aggregate instance of Type Todo,
                and it has trimming rules,
            When the instance is updated once
            Then instance id should have value,
                and its retroEvents count should be 1
                and its retroVersion should be 1,
                and its currentEvents count should be 1,
                and its currentVersion should be 2,
                and its events count should be 2,
                and its version should be 2,
                and its createdAt should be > 0,
                and its updatedAt should be > 0,
                and its createdAt should be <= its updatedAt,
                and its isNew should be true,
                and its hasChanges should be true,
                and its updated property should reflect the last update
        `,
            () =>
            {
                const original = Todo.create(domainContext, "title", "description");

                original.updateDescription("description update 1");

                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                assert.ok(original.id != null && !original.id.isEmptyOrWhiteSpace());
                assert.strictEqual(original.retroEvents.length, 1);
                assert.strictEqual(original.retroVersion, 1);
                assert.strictEqual(original.currentEvents.length, 1);
                assert.strictEqual(original.currentVersion, 2);
                assert.strictEqual(original.events.length, 2);
                assert.strictEqual(original.version, 2);
                assert.ok(original.createdAt > 0);
                assert.ok(original.updatedAt > 0);
                assert.ok(original.createdAt <= original.updatedAt);
                assert.strictEqual(original.isNew, true);
                assert.strictEqual(original.hasChanges, true);
                assert.strictEqual(original.description, "description update 1");
                assert.strictEqual(original.title, "title");
            });

        await test(`
            Given an aggregate instance of Type Todo,
                and it has trimming rules,
                and it has been updated once,
                and it has been serialized and deserialized,
            When the deserialized instance is updated once
            Then the deserialized instance id should be same as original,
                and its retroEvents count should be 1
                and its retroVersion should be 2,
                and its currentEvents count should be 1,
                and its currentVersion should be 3,
                and its events count should be 2,
                and its version should be 3,
                and its createdAt should be same as original createdAt,
                and its updatedAt should be > 0,
                and its createdAt should be < its updatedAt,
                and its isNew should be false,
                and its hasChanges should be true,
                and its updated property should reflect the last update
        `,
            () =>
            {
                const original = Todo.create(domainContext, "title", "description");
                original.updateDescription("description update 1");
                const serialized = original.serialize();
                const deserialized = Todo.deserializeFromEvents(domainContext, Todo, new TodoStateFactory(), serialized.$events);

                deserialized.updateDescription("description update 2");

                assert.strictEqual(deserialized.id, original.id);
                assert.strictEqual(deserialized.retroEvents.length, 1);
                assert.strictEqual(deserialized.retroVersion, 2);
                assert.strictEqual(deserialized.currentEvents.length, 1);
                assert.strictEqual(deserialized.currentVersion, 3);
                assert.strictEqual(deserialized.events.length, 2);
                assert.strictEqual(deserialized.version, 3);
                assert.strictEqual(deserialized.createdAt, original.createdAt);
                assert.ok(deserialized.updatedAt > 0);
                assert.ok(deserialized.createdAt <= deserialized.updatedAt);
                assert.strictEqual(deserialized.isNew, false);
                assert.strictEqual(deserialized.hasChanges, true);
                assert.strictEqual(deserialized.description, "description update 2");
                assert.strictEqual(deserialized.title, "title");
            });

        await test(`
            Given an aggregate instance of Type Todo,
                and it has trimming rules,
                and it has been updated twice,
                and it has been serialized and deserialized,
            When the deserialized instance is updated once
            Then the deserialized instance id should be same as original,
                and its retroEvents count should be 1
                and its retroVersion should be 3,
                and its currentEvents count should be 1,
                and its currentVersion should be 4,
                and its events count should be 2,
                and its version should be 4,
                and its createdAt should be same as original createdAt,
                and its updatedAt should be > 0,
                and its createdAt should be < its updatedAt,
                and its isNew should be false,
                and its hasChanges should be true,
                and its updated property should reflect the last update
        `,
            () =>
            {
                const original = Todo.create(domainContext, "title", "description");
                original.updateDescription("description update 1");
                original.updateDescription("description update 2");
                const serialized = original.serialize();
                const deserialized = Todo.deserializeFromEvents(domainContext, Todo, new TodoStateFactory(), serialized.$events);

                deserialized.updateDescription("description update 3");

                assert.strictEqual(deserialized.id, original.id);
                assert.strictEqual(deserialized.retroEvents.length, 1);
                assert.strictEqual(deserialized.retroVersion, 3);
                assert.strictEqual(deserialized.currentEvents.length, 1);
                assert.strictEqual(deserialized.currentVersion, 4);
                assert.strictEqual(deserialized.events.length, 2);
                assert.strictEqual(deserialized.version, 4);
                assert.strictEqual(deserialized.createdAt, original.createdAt);
                assert.ok(deserialized.updatedAt > 0);
                assert.ok(deserialized.createdAt <= deserialized.updatedAt);
                assert.strictEqual(deserialized.isNew, false);
                assert.strictEqual(deserialized.hasChanges, true);
                assert.strictEqual(deserialized.description, "description update 3");
                assert.strictEqual(deserialized.title, "title");
            });

        await test(`
            Given an aggregate instance of Type Todo,
                and it has trimming rules,
                and it has been updated twice,
                and it has been serialized and deserialized,
            When the deserialized instance is updated twice
            Then the deserialized instance id should be same as original,
                and its retroEvents count should be 1
                and its retroVersion should be 3,
                and its currentEvents count should be 2,
                and its currentVersion should be 5,
                and its events count should be 3,
                and its version should be 5,
                and its createdAt should be same as original createdAt,
                and its updatedAt should be > 0,
                and its createdAt should be < its updatedAt,
                and its isNew should be false,
                and its hasChanges should be true,
                and its updated property should reflect the last update
        `,
            () =>
            {
                const original = Todo.create(domainContext, "title", "description");
                original.updateDescription("description update 1");
                original.updateDescription("description update 2");
                const serialized = original.serialize();
                const deserialized = Todo.deserializeFromEvents(domainContext, Todo, new TodoStateFactory(), serialized.$events);

                deserialized.updateDescription("description update 3");
                deserialized.updateDescription("description update 4");

                assert.strictEqual(deserialized.id, original.id);
                assert.strictEqual(deserialized.retroEvents.length, 1);
                assert.strictEqual(deserialized.retroVersion, 3);
                assert.strictEqual(deserialized.currentEvents.length, 2);
                assert.strictEqual(deserialized.currentVersion, 5);
                assert.strictEqual(deserialized.events.length, 3);
                assert.strictEqual(deserialized.version, 5);
                assert.strictEqual(deserialized.createdAt, original.createdAt);
                assert.ok(deserialized.updatedAt > 0);
                assert.ok(deserialized.createdAt <= deserialized.updatedAt);
                assert.strictEqual(deserialized.isNew, false);
                assert.strictEqual(deserialized.hasChanges, true);
                assert.strictEqual(deserialized.description, "description update 4");
                assert.strictEqual(deserialized.title, "title");
            });
    });

    await describe.skip("Reconstruction with Trimming", async () =>
    {
        await test(`
            Given an aggregate instance of Type Todo,
                and it has trimming rules,
                and it has been updated twice,
                and it has been serialized and deserialized,
                and the deserialized instance is updated twice again,
            When the deserialized instance is reconstructed to version 3,
            Then the reconstructed instance id should be same as original,
                and its retroEvents count should be 1
                and its retroVersion should be 1,
                and its currentEvents count should be 0,
                and its currentVersion should be 1,
                and its events count should be 1,
                and its version should be 1,
                and its createdAt should be same as original createdAt,
                and its updatedAt should be > 0,
                and its createdAt should be <= its updatedAt,
                and its isNew should be false,
                and its hasChanges should be false,
                and its updated property should reflect the creation value
        `,
            () =>
            {
                const original = Todo.create(domainContext, "title", "description");
                original.updateDescription("description update 1");
                original.updateDescription("description update 2");
                const serialized = original.serialize();
                const deserialized = Todo.deserializeFromEvents(domainContext, Todo, new TodoStateFactory(), serialized.$events);
                deserialized.updateDescription("description update 3");
                deserialized.updateDescription("description update 4");

                const reconstructed = deserialized.constructVersion(3);

                assert.strictEqual(reconstructed.id, original.id);
                assert.strictEqual(reconstructed.retroEvents.length, 1);
                assert.strictEqual(reconstructed.retroVersion, 1);
                assert.strictEqual(reconstructed.currentEvents.length, 0);
                assert.strictEqual(reconstructed.currentVersion, 1);
                assert.strictEqual(reconstructed.events.length, 1);
                assert.strictEqual(reconstructed.version, 1);
                assert.strictEqual(reconstructed.createdAt, original.createdAt);
                assert.ok(reconstructed.updatedAt > 0);
                assert.ok(reconstructed.createdAt <= reconstructed.updatedAt);
                assert.strictEqual(reconstructed.isNew, false);
                assert.strictEqual(reconstructed.hasChanges, false);
                assert.strictEqual(reconstructed.title, "title");
                assert.strictEqual(reconstructed.description, "description");
            });

        await test(`
            Given an aggregate instance of Type Todo,
                and it has trimming rules,
                and it has been updated twice,
                and it has been serialized and deserialized,
                and the deserialized instance is updated twice again,
                and it has been serialized and deserialized again
            When the deserialized instance is reconstructed to version 3,
            Then the reconstructed instance id should be same as original,
                and its retroEvents count should be 1
                and its retroVersion should be 1,
                and its currentEvents count should be 0,
                and its currentVersion should be 1,
                and its events count should be 1,
                and its version should be 1,
                and its createdAt should be same as original createdAt,
                and its updatedAt should be > 0,
                and its createdAt should be < its updatedAt,
                and its isNew should be false,
                and its hasChanges should be false,
                and its updated property should reflect the creation value
        `,
            () =>
            {
                const original = Todo.create(domainContext, "title", "description");
                original.updateDescription("description update 1");
                original.updateDescription("description update 2");
                let serialized = original.serialize();
                let deserialized = Todo.deserializeFromEvents(domainContext, Todo, new TodoStateFactory(), serialized.$events);
                deserialized.updateDescription("description update 3");
                deserialized.updateDescription("description update 4");
                serialized = deserialized.serialize();
                deserialized = Todo.deserializeFromEvents(domainContext, Todo, new TodoStateFactory(), serialized.$events);

                const reconstructed = deserialized.constructVersion(3);

                assert.strictEqual(reconstructed.id, original.id);
                assert.strictEqual(reconstructed.retroEvents.length, 1);
                assert.strictEqual(reconstructed.retroVersion, 1);
                assert.strictEqual(reconstructed.currentEvents.length, 0);
                assert.strictEqual(reconstructed.currentVersion, 1);
                assert.strictEqual(reconstructed.events.length, 1);
                assert.strictEqual(reconstructed.version, 1);
                assert.strictEqual(reconstructed.createdAt, original.createdAt);
                assert.ok(reconstructed.updatedAt > 0);
                assert.ok(reconstructed.createdAt <= reconstructed.updatedAt);
                assert.strictEqual(reconstructed.isNew, false);
                assert.strictEqual(reconstructed.hasChanges, false);
                assert.strictEqual(reconstructed.title, "title");
                assert.strictEqual(reconstructed.description, "description");
            });
    });
});



