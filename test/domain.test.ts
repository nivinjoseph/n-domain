import "@nivinjoseph/n-ext";
import * as Assert from "assert";
import { Todo } from "./domain/todo";
import { DevDomainContext } from "../src";


suite("Domain tests", () =>
{
    test("AggregateRoot", () =>
    {
        const domainContext = new DevDomainContext();

        const original = Todo.create(domainContext, "First", "This is the first.");
        original.updateTitle("First 1");
        original.updateTitle("First 2");

        
        Assert.ok(original instanceof Todo);
        Assert.strictEqual((<Object>original).getTypeName(), "Todo");
        
        Assert.ok(original.id != null && !original.id.isEmptyOrWhiteSpace());
        
        Assert.strictEqual(original.retroEvents.length, 1);
        Assert.strictEqual(original.retroVersion, 1);
        
        Assert.strictEqual(original.currentEvents.length, 2);
        Assert.strictEqual(original.currentVersion, 3);
        
        Assert.strictEqual(original.events.length, 3);
        Assert.strictEqual(original.version, 3);
        
        Assert.ok(original.createdAt > 0);
        Assert.ok(original.updatedAt > 0);
        
        Assert.strictEqual(original.hasChanges, true);
        
        Assert.strictEqual(original.title, "First 2");
        Assert.strictEqual(original.description, "This is the first.");


        const serialized = original.serialize();
        const deserialized = Todo.deserialize(domainContext, serialized);

        Assert.ok(deserialized instanceof Todo);
        Assert.strictEqual((<Object>deserialized).getTypeName(), "Todo");
        
        Assert.strictEqual(deserialized.id, original.id);
        
        Assert.strictEqual(deserialized.retroEvents.length, 3);
        Assert.strictEqual(deserialized.retroVersion, 3);

        Assert.strictEqual(deserialized.currentEvents.length, 0);
        Assert.strictEqual(deserialized.currentVersion, 3);

        Assert.strictEqual(deserialized.events.length, 3);
        Assert.strictEqual(deserialized.version, 3);
        
        Assert.strictEqual(deserialized.createdAt, original.createdAt);
        Assert.strictEqual(deserialized.updatedAt, original.updatedAt);
        
        Assert.strictEqual(deserialized.hasChanges, false);
        
        Assert.strictEqual(deserialized.title, original.title);
        Assert.strictEqual(deserialized.description, original.description);

        
        const reconstructed = deserialized.constructVersion(1);

        Assert.ok(reconstructed instanceof Todo);
        Assert.strictEqual((<Object>reconstructed).getTypeName(), "Todo");
        
        Assert.strictEqual(reconstructed.id, original.id);
        
        Assert.strictEqual(reconstructed.retroEvents.length, 1);
        Assert.strictEqual(reconstructed.retroVersion, 1);

        Assert.strictEqual(reconstructed.currentEvents.length, 0);
        Assert.strictEqual(reconstructed.currentVersion, 1);

        Assert.strictEqual(reconstructed.events.length, 1);
        Assert.strictEqual(reconstructed.version, 1);

        Assert.strictEqual(reconstructed.createdAt, original.createdAt);
        Assert.strictEqual(reconstructed.updatedAt, original.createdAt);

        Assert.strictEqual(reconstructed.hasChanges, false);
        
        Assert.strictEqual(reconstructed.title, "First");
        Assert.strictEqual(reconstructed.description, original.description);
    });
    
    test.only("Trimming", () =>
    {
        const domainContext = new DevDomainContext();

        const original = Todo.create(domainContext, "First", "This is the first.");
        original.updateTitle("First 1");
        
        let serialized = original.serialize();
        console.log(serialized);
        let deserialized = Todo.deserialize(domainContext, serialized);
        
        deserialized.updateTitle("First 2");
        
        serialized = deserialized.serialize();
        console.log(serialized);
        
        deserialized = Todo.deserialize(domainContext, serialized);
        console.log(deserialized.serialize());
    });
});



