import "@nivinjoseph/n-ext";
import * as Assert from "assert";
import { Todo } from "./domain/todo";
import { DomainContext, DomainHelper } from "../src";
import { TodoCreated } from "./domain/events/todo-created";
import { Delay, Schema } from "@nivinjoseph/n-util";
import { TodoDescriptionUpdated } from "./domain/events/todo-description-updated";
import { TodoDescription } from "./domain/value-objects/todo-description";


suite("Domain tests", () =>
{
    const domainContext: DomainContext = {userId: "dev"};

    // test("AggregateRoot", () =>
    // {
    //     const domainContext = new DevDomainContext();

    //     const original = Todo.create(domainContext, "First", "This is the first.");
    //     original.updateTitle("First 1");
    //     original.updateTitle("First 2");


    //     Assert.ok(original instanceof Todo);
    //     Assert.strictEqual((<Object>original).getTypeName(), "Todo");

    //     Assert.ok(original.id != null && !original.id.isEmptyOrWhiteSpace());

    //     Assert.strictEqual(original.retroEvents.length, 1);
    //     Assert.strictEqual(original.retroVersion, 1);

    //     Assert.strictEqual(original.currentEvents.length, 2);
    //     Assert.strictEqual(original.currentVersion, 3);

    //     Assert.strictEqual(original.events.length, 3);
    //     Assert.strictEqual(original.version, 3);

    //     Assert.ok(original.createdAt > 0);
    //     Assert.ok(original.updatedAt > 0);

    //     Assert.strictEqual(original.hasChanges, true);

    //     Assert.strictEqual(original.title, "First 2");
    //     Assert.strictEqual(original.description, "This is the first.");


    //     const serialized = original.serialize();
    //     const deserialized = Todo.deserialize(domainContext, serialized);

    //     Assert.ok(deserialized instanceof Todo);
    //     Assert.strictEqual((<Object>deserialized).getTypeName(), "Todo");

    //     Assert.strictEqual(deserialized.id, original.id);

    //     Assert.strictEqual(deserialized.retroEvents.length, 3);
    //     Assert.strictEqual(deserialized.retroVersion, 3);

    //     Assert.strictEqual(deserialized.currentEvents.length, 0);
    //     Assert.strictEqual(deserialized.currentVersion, 3);

    //     Assert.strictEqual(deserialized.events.length, 3);
    //     Assert.strictEqual(deserialized.version, 3);

    //     Assert.strictEqual(deserialized.createdAt, original.createdAt);
    //     Assert.strictEqual(deserialized.updatedAt, original.updatedAt);

    //     Assert.strictEqual(deserialized.hasChanges, false);

    //     Assert.strictEqual(deserialized.title, original.title);
    //     Assert.strictEqual(deserialized.description, original.description);


    //     const reconstructed = deserialized.constructVersion(1);

    //     Assert.ok(reconstructed instanceof Todo);
    //     Assert.strictEqual((<Object>reconstructed).getTypeName(), "Todo");

    //     Assert.strictEqual(reconstructed.id, original.id);

    //     Assert.strictEqual(reconstructed.retroEvents.length, 1);
    //     Assert.strictEqual(reconstructed.retroVersion, 1);

    //     Assert.strictEqual(reconstructed.currentEvents.length, 0);
    //     Assert.strictEqual(reconstructed.currentVersion, 1);

    //     Assert.strictEqual(reconstructed.events.length, 1);
    //     Assert.strictEqual(reconstructed.version, 1);

    //     Assert.strictEqual(reconstructed.createdAt, original.createdAt);
    //     Assert.strictEqual(reconstructed.updatedAt, original.createdAt);

    //     Assert.strictEqual(reconstructed.hasChanges, false);

    //     Assert.strictEqual(reconstructed.title, "First");
    //     Assert.strictEqual(reconstructed.description, original.description);
    // });

    // test("Trimming", () =>
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


    suite("Standard stuff", () =>
    {
        test(`
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
                Assert.ok(original.id != null && !original.id.isEmptyOrWhiteSpace());
                Assert.strictEqual(original.retroEvents.length, 1);
                Assert.strictEqual(original.retroVersion, 1);
                Assert.strictEqual(original.currentEvents.length, 0);
                Assert.strictEqual(original.currentVersion, 1);
                Assert.strictEqual(original.events.length, 1);
                Assert.strictEqual(original.version, 1);
                Assert.ok(original.createdAt > 0);
                Assert.ok(original.updatedAt > 0);
                Assert.strictEqual(original.createdAt, original.updatedAt);
                Assert.strictEqual(original.isNew, true);
                Assert.strictEqual(original.hasChanges, false);
                Assert.strictEqual(original.title, "title");
                Assert.strictEqual(original.description, "description");
            });

        test(`
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
                Assert.ok(original.id != null && !original.id.isEmptyOrWhiteSpace());
                Assert.strictEqual(original.retroEvents.length, 1);
                Assert.strictEqual(original.retroVersion, 1);
                Assert.strictEqual(original.currentEvents.length, 1);
                Assert.strictEqual(original.currentVersion, 2);
                Assert.strictEqual(original.events.length, 2);
                Assert.strictEqual(original.version, 2);
                Assert.ok(original.createdAt > 0);
                Assert.ok(original.updatedAt > 0);
                Assert.ok(original.createdAt <= original.updatedAt);
                Assert.strictEqual(original.isNew, true);
                Assert.strictEqual(original.hasChanges, true);
                Assert.strictEqual(original.title, "title update 1");
                Assert.strictEqual(original.description, "description");
            });

        test(`
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
                Assert.ok(original.id != null && !original.id.isEmptyOrWhiteSpace());
                Assert.strictEqual(original.retroEvents.length, 1);
                Assert.strictEqual(original.retroVersion, 1);
                Assert.strictEqual(original.currentEvents.length, 2);
                Assert.strictEqual(original.currentVersion, 3);
                Assert.strictEqual(original.events.length, 3);
                Assert.strictEqual(original.version, 3);
                Assert.ok(original.createdAt > 0);
                Assert.ok(original.updatedAt > 0);
                Assert.ok(original.createdAt <= original.updatedAt);
                Assert.strictEqual(original.isNew, true);
                Assert.strictEqual(original.hasChanges, true);
                Assert.strictEqual(original.title, "title update 2");
                Assert.strictEqual(original.description, "description");
            });

        test(`
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
                const deserialized = Todo.deserializeEvents(domainContext, serialized.$events);

                Assert.strictEqual(deserialized.id, original.id);
                Assert.strictEqual(deserialized.retroEvents.length, 3);
                Assert.strictEqual(deserialized.retroVersion, 3);
                Assert.strictEqual(deserialized.currentEvents.length, 0);
                Assert.strictEqual(deserialized.currentVersion, 3);
                Assert.strictEqual(deserialized.events.length, 3);
                Assert.strictEqual(deserialized.version, 3);
                Assert.strictEqual(deserialized.createdAt, original.createdAt);
                Assert.strictEqual(deserialized.updatedAt, original.updatedAt);
                Assert.strictEqual(deserialized.isNew, false);
                Assert.strictEqual(deserialized.hasChanges, false);
                Assert.strictEqual(deserialized.title, "title update 2");
                Assert.strictEqual(deserialized.description, "description");
            });

        test(`
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
                const deserialized = Todo.deserializeEvents(domainContext, serialized.$events);
                
                // console.log("Type version", (<any>deserialized).state.typeVersion);

                deserialized.updateTitle("title update 3");

                Assert.strictEqual(deserialized.id, original.id);
                Assert.strictEqual(deserialized.retroEvents.length, 3);
                Assert.strictEqual(deserialized.retroVersion, 3);
                Assert.strictEqual(deserialized.currentEvents.length, 1);
                Assert.strictEqual(deserialized.currentVersion, 4);
                Assert.strictEqual(deserialized.events.length, 4);
                Assert.strictEqual(deserialized.version, 4);
                Assert.strictEqual(deserialized.createdAt, original.createdAt);
                // Assert.ok(deserialized.updatedAt, original.updatedAt);
                Assert.strictEqual(deserialized.isNew, false);
                Assert.strictEqual(deserialized.hasChanges, true);
                Assert.strictEqual(deserialized.title, "title update 3");
                Assert.strictEqual(deserialized.description, "description");
            });
    });


    suite("Reconstruction", () =>
    {
        test(`
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

                Assert.strictEqual(reconstructed.id, original.id);
                Assert.strictEqual(reconstructed.retroEvents.length, 2);
                Assert.strictEqual(reconstructed.retroVersion, 2);
                Assert.strictEqual(reconstructed.currentEvents.length, 0);
                Assert.strictEqual(reconstructed.currentVersion, 2);
                Assert.strictEqual(reconstructed.events.length, 2);
                Assert.strictEqual(reconstructed.version, 2);
                Assert.strictEqual(reconstructed.createdAt, original.createdAt);
                Assert.ok(reconstructed.updatedAt > 0);
                Assert.ok(reconstructed.createdAt <= reconstructed.updatedAt);
                Assert.strictEqual(reconstructed.isNew, false);
                Assert.strictEqual(reconstructed.hasChanges, false);
                Assert.strictEqual(reconstructed.isReconstructed, true);
                Assert.strictEqual(reconstructed.reconstructedFromVersion, 3);
                Assert.strictEqual(reconstructed.title, "title update 1");
                Assert.strictEqual(reconstructed.description, "description");
            });

        test(`
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
                const deserialized = Todo.deserializeEvents(domainContext, serialized.$events);

                const reconstructed = deserialized.constructVersion(2);

                Assert.strictEqual(reconstructed.id, original.id);
                Assert.strictEqual(reconstructed.retroEvents.length, 2);
                Assert.strictEqual(reconstructed.retroVersion, 2);
                Assert.strictEqual(reconstructed.currentEvents.length, 0);
                Assert.strictEqual(reconstructed.currentVersion, 2);
                Assert.strictEqual(reconstructed.events.length, 2);
                Assert.strictEqual(reconstructed.version, 2);
                Assert.strictEqual(reconstructed.createdAt, original.createdAt);
                Assert.ok(reconstructed.updatedAt > 0);
                Assert.ok(reconstructed.createdAt <= reconstructed.updatedAt);
                Assert.strictEqual(reconstructed.isNew, false);
                Assert.strictEqual(reconstructed.hasChanges, false);
                Assert.strictEqual(reconstructed.isReconstructed, true);
                Assert.strictEqual(reconstructed.reconstructedFromVersion, 3);
                Assert.strictEqual(reconstructed.title, "title update 1");
                Assert.strictEqual(reconstructed.description, "description");
            });
    });
    
    suite("Cloning", () =>
    {
        test(`
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
            
            const clone = original.clone(domainContext, new TodoCreated({
                todoId: DomainHelper.generateId("tdo"),
                title: "different title",
                description: TodoDescription.create("different description")
            }));
            
            
            Assert.notStrictEqual(clone.id, original.id, "id");
            Assert.strictEqual(clone.version, original.version, "version");
            Assert.notStrictEqual(clone.createdAt, original.createdAt, "createdAt");
            Assert.notStrictEqual(clone.updatedAt, original.updatedAt, "updatedAt");
            
            Assert.notStrictEqual(clone.title, original.title, "title");
            Assert.strictEqual(clone.description, original.description, "description");
            Assert.strictEqual(clone.isCompleted, original.isCompleted, "isCompleted");
        });
        
        test(`
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

            const clone = original.clone(domainContext, new TodoCreated({
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


            Assert.notStrictEqual(clone.id, original.id, "id");
            Assert.strictEqual(clone.version, original.version, "version");
            Assert.notStrictEqual(clone.createdAt, original.createdAt, "createdAt");
            Assert.notStrictEqual(clone.updatedAt, original.updatedAt, "updatedAt");

            Assert.notStrictEqual(clone.title, original.title, "title");
            Assert.strictEqual(clone.description, "mutated description", "description");
            Assert.strictEqual(clone.isCompleted, original.isCompleted, "isCompleted");
        });
    });
    
    suite("Rebasing", () =>
    {
        test(`
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

                Assert.strictEqual(rebased.id, original.id);
                Assert.strictEqual(rebased.retroEvents.length, 1);
                Assert.strictEqual(rebased.retroVersion, 1);
                Assert.strictEqual(rebased.currentEvents.length, 3);
                Assert.strictEqual(rebased.currentVersion, 4);
                Assert.strictEqual(rebased.events.length, 4);
                Assert.strictEqual(rebased.version, 4);
                Assert.strictEqual(rebased.createdAt, original.createdAt);
                Assert.ok(rebased.updatedAt >= original.updatedAt);
                Assert.ok(rebased.createdAt <= rebased.updatedAt);
                Assert.strictEqual(rebased.isNew, true);
                Assert.strictEqual(rebased.hasChanges, true);
                Assert.strictEqual(rebased.isRebased, true);
                Assert.strictEqual(rebased.rebasedFromVersion, 2);
                Assert.strictEqual(rebased.title, "title update 1");
                Assert.strictEqual(rebased.description, "description");
            });

        test(`
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
                const deserialized = Todo.deserializeEvents(domainContext, serialized.$events);

                const rebased = deserialized;
                rebased.rebase(2);

                Assert.strictEqual(rebased.id, original.id);
                Assert.strictEqual(rebased.retroEvents.length, 3);
                Assert.strictEqual(rebased.retroVersion, 3);
                Assert.strictEqual(rebased.currentEvents.length, 1);
                Assert.strictEqual(rebased.currentVersion, 4);
                Assert.strictEqual(rebased.events.length, 4);
                Assert.strictEqual(rebased.version, 4);
                Assert.strictEqual(rebased.createdAt, original.createdAt);
                Assert.ok(rebased.updatedAt >= original.updatedAt);
                Assert.ok(rebased.createdAt <= rebased.updatedAt);
                Assert.strictEqual(rebased.isNew, false);
                Assert.strictEqual(rebased.hasChanges, true);
                Assert.strictEqual(rebased.isRebased, true);
                Assert.strictEqual(rebased.rebasedFromVersion, 2);
                Assert.strictEqual(rebased.title, "title update 1");
                Assert.strictEqual(rebased.description, "description");
            });
        
        test(`
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
                let deserialized = Todo.deserializeEvents(domainContext, serialized.$events);

                let rebased = deserialized;
                rebased.rebase(2);
                const rebase1Snapshot = JSON.stringify(processSnapshot(rebased.snapshot(), "rebase1"));
                
                rebased.updateTitle("title update 3");
                
                serialized = rebased.serialize();
                deserialized = Todo.deserializeEvents(domainContext, serialized.$events);
                
                rebased = deserialized;
                rebased.rebase(2);
                const rebase2Snapshot = JSON.stringify(processSnapshot(rebased.snapshot(), "rebase2"));

                Assert.strictEqual(rebased.id, original.id);
                Assert.strictEqual(rebased.retroEvents.length, 5);
                Assert.strictEqual(rebased.retroVersion, 5);
                Assert.strictEqual(rebased.currentEvents.length, 1);
                Assert.strictEqual(rebased.currentVersion, 6);
                Assert.strictEqual(rebased.events.length, 6);
                Assert.strictEqual(rebased.version, 6);
                Assert.strictEqual(rebased.createdAt, original.createdAt);
                Assert.ok(rebased.updatedAt >= original.updatedAt);
                Assert.ok(rebased.createdAt <= rebased.updatedAt);
                Assert.strictEqual(rebased.isNew, false);
                Assert.strictEqual(rebased.hasChanges, true);
                Assert.strictEqual(rebased.isRebased, true);
                Assert.strictEqual(rebased.rebasedFromVersion, 2);
                Assert.strictEqual(rebased.title, "title update 1");
                Assert.strictEqual(rebased.description, "description");
                Assert.strictEqual(originalSnapshot, rebase1Snapshot, "original vs rebase 1");
                Assert.strictEqual(rebase1Snapshot, rebase2Snapshot, "rebase 1 vs rebase 2");
            });
    });

    suite.skip("Trimming", () =>
    {
        test(`
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
                Assert.ok(original.id != null && !original.id.isEmptyOrWhiteSpace());
                Assert.strictEqual(original.retroEvents.length, 1);
                Assert.strictEqual(original.retroVersion, 1);
                Assert.strictEqual(original.currentEvents.length, 1);
                Assert.strictEqual(original.currentVersion, 2);
                Assert.strictEqual(original.events.length, 2);
                Assert.strictEqual(original.version, 2);
                Assert.ok(original.createdAt > 0);
                Assert.ok(original.updatedAt > 0);
                Assert.ok(original.createdAt <= original.updatedAt);
                Assert.strictEqual(original.isNew, true);
                Assert.strictEqual(original.hasChanges, true);
                Assert.strictEqual(original.description, "description update 1");
                Assert.strictEqual(original.title, "title");
            });

        test(`
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
                const deserialized = Todo.deserializeEvents(domainContext, serialized.$events);

                deserialized.updateDescription("description update 2");

                Assert.strictEqual(deserialized.id, original.id);
                Assert.strictEqual(deserialized.retroEvents.length, 1);
                Assert.strictEqual(deserialized.retroVersion, 2);
                Assert.strictEqual(deserialized.currentEvents.length, 1);
                Assert.strictEqual(deserialized.currentVersion, 3);
                Assert.strictEqual(deserialized.events.length, 2);
                Assert.strictEqual(deserialized.version, 3);
                Assert.strictEqual(deserialized.createdAt, original.createdAt);
                Assert.ok(deserialized.updatedAt > 0);
                Assert.ok(deserialized.createdAt <= deserialized.updatedAt);
                Assert.strictEqual(deserialized.isNew, false);
                Assert.strictEqual(deserialized.hasChanges, true);
                Assert.strictEqual(deserialized.description, "description update 2");
                Assert.strictEqual(deserialized.title, "title");
            });

        test(`
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
                const deserialized = Todo.deserializeEvents(domainContext, serialized.$events);

                deserialized.updateDescription("description update 3");

                Assert.strictEqual(deserialized.id, original.id);
                Assert.strictEqual(deserialized.retroEvents.length, 1);
                Assert.strictEqual(deserialized.retroVersion, 3);
                Assert.strictEqual(deserialized.currentEvents.length, 1);
                Assert.strictEqual(deserialized.currentVersion, 4);
                Assert.strictEqual(deserialized.events.length, 2);
                Assert.strictEqual(deserialized.version, 4);
                Assert.strictEqual(deserialized.createdAt, original.createdAt);
                Assert.ok(deserialized.updatedAt > 0);
                Assert.ok(deserialized.createdAt <= deserialized.updatedAt);
                Assert.strictEqual(deserialized.isNew, false);
                Assert.strictEqual(deserialized.hasChanges, true);
                Assert.strictEqual(deserialized.description, "description update 3");
                Assert.strictEqual(deserialized.title, "title");
            });

        test(`
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
                const deserialized = Todo.deserializeEvents(domainContext, serialized.$events);

                deserialized.updateDescription("description update 3");
                deserialized.updateDescription("description update 4");

                Assert.strictEqual(deserialized.id, original.id);
                Assert.strictEqual(deserialized.retroEvents.length, 1);
                Assert.strictEqual(deserialized.retroVersion, 3);
                Assert.strictEqual(deserialized.currentEvents.length, 2);
                Assert.strictEqual(deserialized.currentVersion, 5);
                Assert.strictEqual(deserialized.events.length, 3);
                Assert.strictEqual(deserialized.version, 5);
                Assert.strictEqual(deserialized.createdAt, original.createdAt);
                Assert.ok(deserialized.updatedAt > 0);
                Assert.ok(deserialized.createdAt <= deserialized.updatedAt);
                Assert.strictEqual(deserialized.isNew, false);
                Assert.strictEqual(deserialized.hasChanges, true);
                Assert.strictEqual(deserialized.description, "description update 4");
                Assert.strictEqual(deserialized.title, "title");
            });
    });

    suite.skip("Reconstruction with Trimming", () =>
    {
        test(`
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
                const deserialized = Todo.deserializeEvents(domainContext, serialized.$events);
                deserialized.updateDescription("description update 3");
                deserialized.updateDescription("description update 4");

                const reconstructed = deserialized.constructVersion(3);

                Assert.strictEqual(reconstructed.id, original.id);
                Assert.strictEqual(reconstructed.retroEvents.length, 1);
                Assert.strictEqual(reconstructed.retroVersion, 1);
                Assert.strictEqual(reconstructed.currentEvents.length, 0);
                Assert.strictEqual(reconstructed.currentVersion, 1);
                Assert.strictEqual(reconstructed.events.length, 1);
                Assert.strictEqual(reconstructed.version, 1);
                Assert.strictEqual(reconstructed.createdAt, original.createdAt);
                Assert.ok(reconstructed.updatedAt > 0);
                Assert.ok(reconstructed.createdAt <= reconstructed.updatedAt);
                Assert.strictEqual(reconstructed.isNew, false);
                Assert.strictEqual(reconstructed.hasChanges, false);
                Assert.strictEqual(reconstructed.title, "title");
                Assert.strictEqual(reconstructed.description, "description");
            });

        test(`
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
                let deserialized = Todo.deserializeEvents(domainContext, serialized.$events);
                deserialized.updateDescription("description update 3");
                deserialized.updateDescription("description update 4");
                serialized = deserialized.serialize();
                deserialized = Todo.deserializeEvents(domainContext, serialized.$events);

                const reconstructed = deserialized.constructVersion(3);

                Assert.strictEqual(reconstructed.id, original.id);
                Assert.strictEqual(reconstructed.retroEvents.length, 1);
                Assert.strictEqual(reconstructed.retroVersion, 1);
                Assert.strictEqual(reconstructed.currentEvents.length, 0);
                Assert.strictEqual(reconstructed.currentVersion, 1);
                Assert.strictEqual(reconstructed.events.length, 1);
                Assert.strictEqual(reconstructed.version, 1);
                Assert.strictEqual(reconstructed.createdAt, original.createdAt);
                Assert.ok(reconstructed.updatedAt > 0);
                Assert.ok(reconstructed.createdAt <= reconstructed.updatedAt);
                Assert.strictEqual(reconstructed.isNew, false);
                Assert.strictEqual(reconstructed.hasChanges, false);
                Assert.strictEqual(reconstructed.title, "title");
                Assert.strictEqual(reconstructed.description, "description");
            });
    });
});



